import { useState, useRef, useEffect } from "react";
import { Send, MessageSquare, Users, UserPlus, MoreVertical } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMessages, useSendMessage } from "@/hooks/useMessages";
import { useAllProfiles, Profile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useConversations } from "@/hooks/useConversations";
import { useConversationParticipants } from "@/hooks/useConversationParticipants";
import AddGroupMembersDialog from "./AddGroupMembersDialog";
import UserProfileDialog from "./UserProfileDialog";

interface ChatMainProps {
  conversationId: string | null;
}

const ChatMain = ({ conversationId }: ChatMainProps) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState("");
  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { data: messages = [] } = useMessages(conversationId);
  const { data: profiles = [] } = useAllProfiles();
  const { data: conversations = [] } = useConversations();
  const { data: participants = [] } = useConversationParticipants(conversationId);
  const sendMessage = useSendMessage();
  const { user } = useAuth();

  const currentConversation = conversations.find((c) => c.id === conversationId);
  const participantUserIds = participants.map((p) => p.user_id);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getProfile = (userId: string) => {
    return profiles.find((p) => p.user_id === userId);
  };

  const handleAvatarClick = (userId: string) => {
    const profile = getProfile(userId);
    if (profile) {
      setSelectedProfile(profile);
      setProfileDialogOpen(true);
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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !conversationId) return;

    try {
      await sendMessage.mutateAsync({
        conversationId,
        content: message,
      });
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  if (!conversationId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background p-4 ml-0 md:ml-0">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-primary rounded-full flex items-center justify-center mb-4 md:mb-6">
          <MessageSquare className="w-8 h-8 md:w-10 md:h-10 text-primary-foreground" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2 text-center">{t('chat.welcome')}</h2>
        <p className="text-muted-foreground text-center max-w-md text-sm md:text-base px-4">
          {t('chat.welcomeSubtitle')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      {currentConversation && (
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-primary/20 text-primary">
                {currentConversation.is_group ? (
                  <Users className="w-5 h-5" />
                ) : (
                  currentConversation.name?.[0]?.toUpperCase() || "C"
                )}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-foreground">
                {currentConversation.name || t('chat.title')}
              </h3>
              {currentConversation.is_group && (
                <p className="text-sm text-muted-foreground">
                  {t('chat.members', { count: participants.length })}
                </p>
              )}
            </div>
          </div>
          
          {currentConversation.is_group && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setAddMembersOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  {t('chat.addMembers')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => {
          const isOwn = msg.sender_id === user?.id;
          const senderProfile = getProfile(msg.sender_id);

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
            >
              <button
                onClick={() => handleAvatarClick(msg.sender_id)}
                className="relative hover:ring-2 hover:ring-primary/50 rounded-full transition-all"
              >
                <Avatar className="w-8 h-8 cursor-pointer">
                  <AvatarFallback className={isOwn ? "bg-primary text-primary-foreground" : "bg-secondary"}>
                    {senderProfile?.display_name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background ${getStatusColor(
                    senderProfile?.status
                  )}`}
                />
              </button>
              <div
                className={`max-w-md px-4 py-2 rounded-2xl ${
                  isOwn
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary text-secondary-foreground rounded-bl-md"
                }`}
              >
                {currentConversation?.is_group && !isOwn && (
                  <p className="text-xs font-medium mb-1 opacity-70">
                    {senderProfile?.display_name || "Unknown"}
                  </p>
                )}
                <p>{msg.content}</p>
                <span className={`text-xs ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Input
            placeholder={t('chat.typeMessage')}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={!message.trim()}>
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </form>

      {/* Dialogs */}
      {conversationId && (
        <AddGroupMembersDialog
          open={addMembersOpen}
          onOpenChange={setAddMembersOpen}
          conversationId={conversationId}
          existingParticipantIds={participantUserIds}
        />
      )}
      
      <UserProfileDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        profile={selectedProfile}
        onStartChat={() => {}}
      />
    </div>
  );
};

export default ChatMain;
