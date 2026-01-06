import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
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
import { toast } from "sonner";

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationCreated: (id: string) => void;
}

const NewChatDialog = ({ open, onOpenChange, onConversationCreated }: NewChatDialogProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { data: profiles = [] } = useAllProfiles();
  const { user } = useAuth();
  const createConversation = useCreateConversation();

  const filteredProfiles = profiles.filter(
    (p) =>
      p.user_id !== user?.id &&
      (p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.display_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelectUser = async (userId: string, displayName: string) => {
    if (isCreating) return;
    
    setIsCreating(true);
    try {
      const conversation = await createConversation.mutateAsync({
        participantUserId: userId,
      });
      toast.success(t('chat.chatCreated') || 'Chat created', {
        description: t('chat.chatCreatedDesc', { name: displayName }) || `Started chat with ${displayName}`,
      });
      onConversationCreated(conversation.id);
      onOpenChange(false);
      setSearchQuery("");
    } catch (error: any) {
      console.error("Failed to create conversation:", error);
      toast.error(t('chat.chatCreationFailed') || 'Failed to create chat', {
        description: error?.message || t('groups.tryAgain') || 'Please try again',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-sidebar border-sidebar-border text-sidebar-foreground">
        <DialogHeader>
          <DialogTitle>{t('chat.newChat')}</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sidebar-muted" />
          <Input
            placeholder={t('users.searchUsers')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-sidebar-accent border-primary/30 focus:border-primary text-sidebar-foreground placeholder:text-sidebar-muted"
          />
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2">
          {isCreating && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-sidebar-muted">{t('common.loading')}</span>
            </div>
          )}
          {!isCreating && filteredProfiles.map((profile) => (
            <div
              key={profile.id}
              onClick={() => handleSelectUser(profile.user_id, profile.display_name)}
              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-sidebar-accent transition-colors"
            >
              <div className="relative">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {profile.display_name[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {profile.status === "online" && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-sidebar"></span>
                )}
              </div>
              <div>
                <h4 className="font-medium">{profile.display_name}</h4>
                <p className="text-sm text-sidebar-muted">@{profile.username}</p>
              </div>
            </div>
          ))}
          {!isCreating && filteredProfiles.length === 0 && (
            <p className="text-center text-sidebar-muted py-4">{t('users.noUsersFound')}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewChatDialog;
