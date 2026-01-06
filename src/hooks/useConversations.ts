import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Conversation {
  id: string;
  name: string | null;
  is_group: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  is_favorite: boolean;
}

export function useConversations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data: participants, error: pError } = await supabase
        .from('conversation_participants')
        .select('conversation_id, is_favorite')
        .eq('user_id', user.id);

      if (pError) throw pError;
      if (!participants?.length) return [];

      const conversationIds = participants.map(p => p.conversation_id);
      
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('*')
        .in('id', conversationIds);

      if (error) throw error;

      return conversations.map(conv => ({
        ...conv,
        is_favorite: participants.find(p => p.conversation_id === conv.id)?.is_favorite || false
      }));
    },
    enabled: !!user,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ participantUserId }: { participantUserId: string }) => {
      if (!user) throw new Error('Not authenticated');

      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({ is_group: false })
        .select()
        .single();

      if (convError) throw convError;

      // Add current user as participant
      const { error: p1Error } = await supabase
        .from('conversation_participants')
        .insert({ conversation_id: conversation.id, user_id: user.id });

      if (p1Error) throw p1Error;

      // Add other participant
      const { error: p2Error } = await supabase
        .from('conversation_participants')
        .insert({ conversation_id: conversation.id, user_id: participantUserId });

      if (p2Error) throw p2Error;

      return conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useCreateGroupConversation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ name, participantUserIds }: { 
      name: string; 
      participantUserIds: string[];
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Create group conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({ is_group: true, name })
        .select()
        .single();

      if (convError) throw convError;

      // Add current user as participant
      const { error: ownerError } = await supabase
        .from('conversation_participants')
        .insert({ conversation_id: conversation.id, user_id: user.id });

      if (ownerError) throw ownerError;

      // Add other participants if any
      if (participantUserIds.length > 0) {
        const participants = participantUserIds.map((userId) => ({
          conversation_id: conversation.id,
          user_id: userId,
        }));

        const { error: participantsError } = await supabase
          .from('conversation_participants')
          .insert(participants);

        if (participantsError) throw participantsError;
      }

      return conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useAddParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      const { data, error } = await supabase
        .from('conversation_participants')
        .insert({ conversation_id: conversationId, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
