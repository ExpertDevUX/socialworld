import { useState } from "react";
import { 
  Search, 
  Edit, 
  User, 
  Settings, 
  Star, 
  Users, 
  LogOut, 
  Plus,
  Shield
} from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import { useProfile, Profile } from "@/hooks/useProfile";
import { useConversations } from "@/hooks/useConversations";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useRoles";
import NewChatDialog from "./NewChatDialog";
import CreateGroupDialog from "./CreateGroupDialog";
import UserProfileDialog from "./UserProfileDialog";
import ThemeToggle from "./ThemeToggle";
import LanguageSelector from "./LanguageSelector";
import AdBanner from "./AdBanner";
import NotificationDropdown from "./NotificationDropdown";
import StatusSelector from "./StatusSelector";
import StatusIndicator from "./StatusIndicator";
import { TooltipProvider } from "@/components/ui/tooltip";

interface ChatSidebarProps {
  selectedConversation: string | null;
  onSelectConversation: (id: string) => void;
}

const ChatSidebar = ({ selectedConversation, onSelectConversation }: ChatSidebarProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "favorites" | "groups">("all");
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<Profile | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  
  const { data: profile } = useProfile();
  const { data: conversations = [] } = useConversations();
  const { signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = !searchQuery || 
      conv.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "favorites") return conv.is_favorite && matchesSearch;
    if (activeTab === "groups") return conv.is_group && matchesSearch;
    return matchesSearch;
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleViewProfile = () => {
    if (profile) {
      setSelectedUserProfile(profile as Profile);
      setProfileDialogOpen(true);
    }
  };

  return (
    <TooltipProvider>
      <div className="w-80 h-screen bg-sidebar flex flex-col border-r border-sidebar-border">
        {/* Header */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <StatusSelector onProfileClick={handleViewProfile} />
              <div>
                <h2 className="font-semibold text-sidebar-foreground">{t('chat.title')}</h2>
                <span className="text-xs text-primary flex items-center gap-1 capitalize">
                  <StatusIndicator status={profile?.status} size="sm" showTooltip={false} />
                  {t(`profile.${profile?.status || 'online'}`)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-sidebar-muted hover:text-sidebar-foreground">
                    <Plus className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-sidebar border-sidebar-border">
                  <DropdownMenuItem onClick={() => setNewChatOpen(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    {t('chat.newChat')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCreateGroupOpen(true)}>
                    <Users className="w-4 h-4 mr-2" />
                    {t('chat.createGroup')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <NotificationDropdown onNavigateToConversation={onSelectConversation} />
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-sidebar-muted hover:text-sidebar-foreground"
                onClick={() => navigate("/profile")}
              >
                <User className="w-5 h-5" />
              </Button>
              {isAdmin && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-sidebar-muted hover:text-sidebar-foreground"
                  onClick={() => navigate("/admin")}
                  title="Admin Panel"
                >
                  <Shield className="w-5 h-5" />
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-sidebar-muted hover:text-sidebar-foreground"
                onClick={() => navigate("/settings")}
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sidebar-muted" />
          <Input
            placeholder={t('chat.searchConversations')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-sidebar-accent border-0 text-sidebar-foreground placeholder:text-sidebar-muted"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 flex gap-2">
        <Button
          variant={activeTab === "all" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("all")}
          className={activeTab === "all" ? "" : "text-sidebar-muted hover:text-sidebar-foreground"}
        >
          {t('chat.all')}
        </Button>
        <Button
          variant={activeTab === "favorites" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("favorites")}
          className={activeTab === "favorites" ? "" : "text-sidebar-muted hover:text-sidebar-foreground"}
        >
          <Star className="w-4 h-4 mr-1" />
          {t('chat.favorites')}
        </Button>
        <Button
          variant={activeTab === "groups" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("groups")}
          className={activeTab === "groups" ? "" : "text-sidebar-muted hover:text-sidebar-foreground"}
        >
          <Users className="w-4 h-4 mr-1" />
          {t('chat.groups')}
        </Button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-sidebar-muted">
            <Users className="w-12 h-12 mb-2 opacity-50" />
            <p>{t('chat.noConversations')}</p>
            <Button 
              variant="link" 
              size="sm" 
              onClick={() => activeTab === "groups" ? setCreateGroupOpen(true) : setNewChatOpen(true)}
              className="mt-2"
            >
              {activeTab === "groups" ? t('chat.createAGroup') : t('chat.startChat')}
            </Button>
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className={`p-3 rounded-lg cursor-pointer mb-2 transition-colors ${
                selectedConversation === conv.id
                  ? "bg-sidebar-accent"
                  : "hover:bg-sidebar-accent/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {conv.is_group ? <Users className="w-5 h-5" /> : (conv.name?.[0]?.toUpperCase() || "C")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sidebar-foreground truncate">
                      {conv.name || t('chat.title')}
                    </h3>
                    {conv.is_group && (
                      <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">{t('chat.group')}</span>
                    )}
                  </div>
                  <p className="text-sm text-sidebar-muted truncate">
                    Click to view messages
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Ad Banner */}
      <AdBanner placement="sidebar" />

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-sidebar-muted hover:text-sidebar-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="w-5 h-5" />
        </Button>
        <div className="flex gap-1">
          <LanguageSelector />
          <ThemeToggle />
        </div>
      </div>

        <NewChatDialog open={newChatOpen} onOpenChange={setNewChatOpen} onConversationCreated={onSelectConversation} />
        <CreateGroupDialog open={createGroupOpen} onOpenChange={setCreateGroupOpen} onGroupCreated={onSelectConversation} />
        <UserProfileDialog 
          open={profileDialogOpen} 
          onOpenChange={setProfileDialogOpen} 
          profile={selectedUserProfile}
          onStartChat={onSelectConversation}
        />
      </div>
    </TooltipProvider>
  );
};

export default ChatSidebar;
