import { useState } from "react";
import { Users, Check, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { useAllProfiles } from "@/hooks/useProfile";
import { useCreateGroupConversation } from "@/hooks/useConversations";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupCreated: (id: string) => void;
}

const CreateGroupDialog = ({ open, onOpenChange, onGroupCreated }: CreateGroupDialogProps) => {
  const { t } = useTranslation();
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: profiles = [] } = useAllProfiles();
  const { user } = useAuth();
  const createGroup = useCreateGroupConversation();

  const filteredProfiles = profiles.filter(
    (p) =>
      p.user_id !== user?.id &&
      (p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.display_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim()) return;

    try {
      const conversation = await createGroup.mutateAsync({
        name: groupName,
        participantUserIds: selectedUsers,
      });
      toast.success(t('groups.groupCreated'), {
        description: t('groups.groupCreatedDesc', { name: groupName }),
      });
      onGroupCreated(conversation.id);
      onOpenChange(false);
      setGroupName("");
      setSelectedUsers([]);
      setSearchQuery("");
    } catch (error) {
      console.error("Failed to create group:", error);
      toast.error(t('groups.groupCreationFailed'), {
        description: t('groups.tryAgain'),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-sidebar border-sidebar-border text-sidebar-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t('chat.createGroup')}
          </DialogTitle>
          <DialogDescription>
            {t('groups.createGroupDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sidebar-foreground">{t('groups.groupName')}</Label>
            <Input
              placeholder={t('groups.enterGroupName')}
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="mt-1 bg-sidebar-accent border-primary/30 focus:border-primary text-sidebar-foreground"
            />
          </div>

          <div>
            <Label className="text-sidebar-foreground">{t('groups.addMembersOptional')}</Label>
            <Input
              placeholder={t('users.searchUsersToAdd')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mt-1 bg-sidebar-accent border-primary/30 focus:border-primary text-sidebar-foreground placeholder:text-sidebar-muted"
            />
          </div>

          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((userId) => {
                const profile = profiles.find((p) => p.user_id === userId);
                return (
                  <span
                    key={userId}
                    className="inline-flex items-center gap-1 bg-primary/20 text-primary px-2 py-1 rounded-full text-sm"
                  >
                    {profile?.display_name}
                    <button
                      onClick={() => toggleUser(userId)}
                      className="hover:bg-primary/30 rounded-full p-0.5"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          <div className="max-h-40 overflow-y-auto space-y-1">
            {filteredProfiles.map((profile) => {
              const isSelected = selectedUsers.includes(profile.user_id);
              return (
                <div
                  key={profile.id}
                  onClick={() => toggleUser(profile.user_id)}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                    isSelected ? "bg-primary/20" : "hover:bg-sidebar-accent"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {profile.display_name[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{profile.display_name}</p>
                      <p className="text-xs text-sidebar-muted">@{profile.username}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-primary" />}
                </div>
              );
            })}
          </div>

          <Button
            onClick={handleCreate}
            disabled={!groupName.trim() || createGroup.isPending}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            {createGroup.isPending ? t('groups.creating') : t('groups.createGroup')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupDialog;
