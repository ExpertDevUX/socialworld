import { Check, X, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFriendRequests, useRespondToFriendRequest } from "@/hooks/useFriendships";
import { useAllProfiles } from "@/hooks/useProfile";
import { toast } from "sonner";

const FriendRequestsSection = () => {
  const { t } = useTranslation();
  const { data: friendRequests = [], isLoading } = useFriendRequests();
  const { data: profiles = [] } = useAllProfiles();
  const respondToRequest = useRespondToFriendRequest();

  const handleRespond = async (friendshipId: string, accept: boolean, requesterName: string) => {
    try {
      await respondToRequest.mutateAsync({ friendshipId, accept });
      toast.success(accept ? t('friendRequests.accepted') : t('friendRequests.declined'), {
        description: accept 
          ? t('friendRequests.acceptedDesc', { name: requesterName })
          : t('friendRequests.declinedDesc', { name: requesterName }),
      });
    } catch (error) {
      toast.error(t('friendRequests.respondFailed'));
    }
  };

  const getRequesterProfile = (requesterId: string) => {
    return profiles.find(p => p.user_id === requesterId);
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
          <UserPlus className="w-4 h-4" />
          {t('friendRequests.title')} ({friendRequests.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {friendRequests.length === 0 ? (
          <p className="text-sidebar-muted text-sm text-center py-2">
            {t('friendRequests.noRequests')}
          </p>
        ) : (
          friendRequests.map((request) => {
            const requester = getRequesterProfile(request.requester_id);
            return (
              <div
                key={request.id}
                className="flex items-center justify-between p-3 bg-sidebar rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {requester?.display_name?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sidebar-foreground">
                      {requester?.display_name || t('friendRequests.unknownUser')}
                    </p>
                    <p className="text-xs text-sidebar-muted">
                      @{requester?.username || 'unknown'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleRespond(request.id, true, requester?.display_name || '')}
                    disabled={respondToRequest.isPending}
                    className="gap-1"
                  >
                    <Check className="w-4 h-4" />
                    {t('friendRequests.accept')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRespond(request.id, false, requester?.display_name || '')}
                    disabled={respondToRequest.isPending}
                    className="gap-1"
                  >
                    <X className="w-4 h-4" />
                    {t('friendRequests.decline')}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default FriendRequestsSection;
