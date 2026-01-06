import { useState } from "react";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAllProfiles } from "@/hooks/useProfile";
import { useCreateConversation } from "@/hooks/useConversations";
import { useAuth } from "@/contexts/AuthContext";

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationCreated: (id: string) => void;
}

const NewChatDialog = ({ open, onOpenChange, onConversationCreated }: NewChatDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: profiles = [] } = useAllProfiles();
  const { user } = useAuth();
  const createConversation = useCreateConversation();

  const filteredProfiles = profiles.filter(
    (p) =>
      p.user_id !== user?.id &&
      (p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.display_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelectUser = async (userId: string) => {
    try {
      const conversation = await createConversation.mutateAsync({
        participantUserId: userId,
      });
      onConversationCreated(conversation.id);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-sidebar border-sidebar-border text-sidebar-foreground">
        <DialogHeader>
          <DialogTitle>Start a new chat</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sidebar-muted" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-sidebar-accent border-primary/30 focus:border-primary text-sidebar-foreground placeholder:text-sidebar-muted"
          />
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2">
          {filteredProfiles.map((profile) => (
            <div
              key={profile.id}
              onClick={() => handleSelectUser(profile.user_id)}
              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-sidebar-accent transition-colors"
            >
              <div className="relative">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {profile.display_name[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {profile.status === "online" && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-sidebar"></span>
                )}
              </div>
              <div>
                <h4 className="font-medium">{profile.display_name}</h4>
                <p className="text-sm text-sidebar-muted">@{profile.username}</p>
              </div>
            </div>
          ))}
          {filteredProfiles.length === 0 && (
            <p className="text-center text-sidebar-muted py-4">No users found</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewChatDialog;
