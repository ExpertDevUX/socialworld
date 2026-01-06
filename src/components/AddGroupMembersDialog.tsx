import { useState } from "react";
import { Users, Check, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAllProfiles } from "@/hooks/useProfile";
import { useAddParticipant } from "@/hooks/useConversations";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface AddGroupMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  existingParticipantIds: string[];
}

const AddGroupMembersDialog = ({
  open,
  onOpenChange,
  conversationId,
  existingParticipantIds,
}: AddGroupMembersDialogProps) => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: profiles = [] } = useAllProfiles();
  const { user } = useAuth();
  const addParticipant = useAddParticipant();

  const filteredProfiles = profiles.filter(
    (p) =>
      p.user_id !== user?.id &&
      !existingParticipantIds.includes(p.user_id) &&
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

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) return;

    try {
      for (const userId of selectedUsers) {
        await addParticipant.mutateAsync({
          conversationId,
          userId,
        });
      }
      toast.success(`Added ${selectedUsers.length} member(s) to the group`);
      onOpenChange(false);
      setSelectedUsers([]);
      setSearchQuery("");
    } catch (error) {
      console.error("Failed to add members:", error);
      toast.error("Failed to add members");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-sidebar border-sidebar-border text-sidebar-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add Members
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Search users to add..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-sidebar-accent border-primary/30 focus:border-primary text-sidebar-foreground placeholder:text-sidebar-muted"
          />

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
            {filteredProfiles.length === 0 ? (
              <p className="text-center text-sidebar-muted py-4">
                No users available to add
              </p>
            ) : (
              filteredProfiles.map((profile) => {
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
              })
            )}
          </div>

          <Button
            onClick={handleAddMembers}
            disabled={selectedUsers.length === 0 || addParticipant.isPending}
            className="w-full"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {addParticipant.isPending ? "Adding..." : `Add ${selectedUsers.length || ""} Member${selectedUsers.length !== 1 ? "s" : ""}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddGroupMembersDialog;
