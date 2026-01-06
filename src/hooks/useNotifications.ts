import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  type: 'message' | 'friend_request' | 'friend_accepted';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: Record<string, any>;
}

export function useNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Listen for new messages
  useEffect(() => {
    if (!user) return;

    console.log('Setting up realtime notifications for user:', user.id);

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel('new-messages-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          console.log('New message received:', payload);
          const message = payload.new as any;
          
          // Don't notify for own messages
          if (message.sender_id === user.id) return;

          // Check if user is participant
          const { data: participant } = await supabase
            .from('conversation_participants')
            .select('*')
            .eq('conversation_id', message.conversation_id)
            .eq('user_id', user.id)
            .maybeSingle();

          if (!participant) return;

          // Get sender profile
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', message.sender_id)
            .single();

          const notification: Notification = {
            id: `msg-${message.id}`,
            type: 'message',
            title: 'New Message',
            message: `${senderProfile?.display_name || 'Someone'}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
            read: false,
            created_at: message.created_at,
            data: { conversation_id: message.conversation_id },
          };

          setNotifications((prev) => [notification, ...prev.slice(0, 49)]);
          setUnreadCount((prev) => prev + 1);

          toast({
            title: notification.title,
            description: notification.message,
          });
        }
      )
      .subscribe();

    // Subscribe to friend requests
    const friendsChannel = supabase
      .channel('friend-requests-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friendships',
        },
        async (payload) => {
          console.log('New friendship event:', payload);
          const friendship = payload.new as any;
          
          // Only notify addressee of new requests
          if (friendship.addressee_id !== user.id) return;

          // Get requester profile
          const { data: requesterProfile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', friendship.requester_id)
            .single();

          const notification: Notification = {
            id: `friend-${friendship.id}`,
            type: 'friend_request',
            title: 'Friend Request',
            message: `${requesterProfile?.display_name || 'Someone'} sent you a friend request`,
            read: false,
            created_at: friendship.created_at,
            data: { friendship_id: friendship.id, requester_id: friendship.requester_id },
          };

          setNotifications((prev) => [notification, ...prev.slice(0, 49)]);
          setUnreadCount((prev) => prev + 1);

          toast({
            title: notification.title,
            description: notification.message,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'friendships',
        },
        async (payload) => {
          const friendship = payload.new as any;
          
          // Notify requester when request is accepted
          if (friendship.status === 'accepted' && friendship.requester_id === user.id) {
            const { data: addresseeProfile } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('user_id', friendship.addressee_id)
              .single();

            const notification: Notification = {
              id: `friend-accepted-${friendship.id}`,
              type: 'friend_accepted',
              title: 'Friend Request Accepted',
              message: `${addresseeProfile?.display_name || 'Someone'} accepted your friend request`,
              read: false,
              created_at: new Date().toISOString(),
              data: { friendship_id: friendship.id, friend_id: friendship.addressee_id },
            };

            setNotifications((prev) => [notification, ...prev.slice(0, 49)]);
            setUnreadCount((prev) => prev + 1);

            toast({
              title: notification.title,
              description: notification.message,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(friendsChannel);
    };
  }, [user, toast]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
}
