import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFriendships } from "@/hooks/useFriendships";
import { useAllProfiles } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface OnlineStatus {
  [userId: string]: boolean;
}

const FriendsListSection = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: friendships = [], isLoading } = useFriendships();
  const { data: profiles = [] } = useAllProfiles();
  const [onlineUsers, setOnlineUsers] = useState<OnlineStatus>({});

  // Get accepted friends
  const acceptedFriends = friendships
    .filter(f => f.status === "accepted")
    .map(f => {
      const friendUserId = f.requester_id === user?.id ? f.addressee_id : f.requester_id;
      return profiles.find(p => p.user_id === friendUserId);
    })
    .filter(Boolean);

  // Track online presence
  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const online: OnlineStatus = {};
        Object.keys(state).forEach(key => {
          online[key] = true;
        });
        setOnlineUsers(online);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUsers(prev => ({ ...prev, [key]: true }));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers(prev => ({ ...prev, [key]: false }));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const isOnline = (userId: string) => {
    return onlineUsers[userId] || false;
  };

  if (isLoading) {
    return (
      <Card className="bg-sidebar-accent border-sidebar-border">
        <CardContent className="pt-6">
          <p className="text-sidebar-muted text-center">{t('common.loading')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-sidebar-accent border-sidebar-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-sidebar-muted uppercase flex items-center gap-2">
          <Users className="w-4 h-4" />
          {t('friendsList.title')} ({acceptedFriends.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {acceptedFriends.length === 0 ? (
          <p className="text-sidebar-muted text-sm text-center py-2">
            {t('friendsList.noFriends')}
          </p>
        ) : (
          acceptedFriends.map((friend) => {
            if (!friend) return null;
            const online = isOnline(friend.user_id);
            return (
              <div
                key={friend.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar transition-colors"
              >
                <div className="relative">
                  <Avatar className="w-9 h-9">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {friend.display_name?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-sidebar-accent rounded-full ${
                    online ? "bg-green-500" : "bg-gray-500"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sidebar-foreground text-sm truncate">
                    {friend.display_name}
                  </p>
                  <p className="text-xs text-sidebar-muted truncate">
                    @{friend.username}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  online 
                    ? "bg-green-500/20 text-green-500" 
                    : "bg-muted text-muted-foreground"
                }`}>
                  {online ? t('friendsList.online') : t('friendsList.offline')}
                </span>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default FriendsListSection;
