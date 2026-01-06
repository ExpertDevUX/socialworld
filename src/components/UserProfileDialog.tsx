import { MessageCircle, UserPlus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Profile } from "@/hooks/useProfile";
import { useSendFriendRequest, useFriendships } from "@/hooks/useFriendships";
import { useCreateConversation } from "@/hooks/useConversations";
import { useAuth } from "@/contexts/AuthContext";

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile | null;
  onStartChat?: (conversationId: string) => void;
}

const UserProfileDialog = ({ open, onOpenChange, profile, onStartChat }: UserProfileDialogProps) => {
  const { user } = useAuth();
  const { data: friendships = [] } = useFriendships();
  const sendFriendRequest = useSendFriendRequest();
  const createConversation = useCreateConversation();

  if (!profile) return null;

  const isOwnProfile = profile.user_id === user?.id;
  
  const existingFriendship = friendships.find(
    (f) =>
      (f.requester_id === profile.user_id || f.addressee_id === profile.user_id)
  );

  const handleSendRequest = async () => {
    try {
      await sendFriendRequest.mutateAsync(profile.user_id);
    } catch (error) {
      console.error("Failed to send friend request:", error);
    }
  };

  const handleStartChat = async () => {
    try {
      const conversation = await createConversation.mutateAsync({
        participantUserId: profile.user_id,
      });
      onOpenChange(false);
      onStartChat?.(conversation.id);
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "busy":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-sidebar border-sidebar-border text-sidebar-foreground max-w-sm">
        <DialogHeader>
          <DialogTitle className="sr-only">User Profile</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <Avatar className="w-24 h-24">
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                {profile.display_name[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span
              className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-sidebar ${getStatusColor(
                profile.status
              )}`}
            />
          </div>

          <h2 className="text-xl font-bold mb-1">{profile.display_name}</h2>
          <p className="text-sidebar-muted mb-2">@{profile.username}</p>

          <span className="inline-flex items-center gap-1 text-xs bg-primary/20 text-primary px-3 py-1 rounded-full mb-4 capitalize">
            <span className={`w-2 h-2 rounded-full ${getStatusColor(profile.status)}`}></span>
            {profile.status || "offline"}
          </span>

          {!isOwnProfile && (
            <div className="flex gap-2 w-full">
              <Button
                onClick={handleStartChat}
                className="flex-1"
                disabled={createConversation.isPending}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Message
              </Button>
              
              {!existingFriendship ? (
                <Button
                  variant="outline"
                  onClick={handleSendRequest}
                  disabled={sendFriendRequest.isPending}
                  className="flex-1"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Friend
                </Button>
              ) : (
                <Button variant="outline" disabled className="flex-1">
                  {existingFriendship.status === "accepted" ? "Friends" : "Pending"}
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileDialog;
