import { useState } from "react";
import { 
  Search, 
  Edit, 
  Bell, 
  User, 
  Settings, 
  Star, 
  Users, 
  LogOut, 
  Languages,
  Moon
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/useProfile";
import { useConversations } from "@/hooks/useConversations";
import { useAuth } from "@/contexts/AuthContext";
import NewChatDialog from "./NewChatDialog";

interface ChatSidebarProps {
  selectedConversation: string | null;
  onSelectConversation: (id: string) => void;
}

const ChatSidebar = ({ selectedConversation, onSelectConversation }: ChatSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "favorites" | "groups">("all");
  const [newChatOpen, setNewChatOpen] = useState(false);
  
  const { data: profile } = useProfile();
  const { data: conversations = [] } = useConversations();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const filteredConversations = conversations.filter(conv => {
    if (activeTab === "favorites") return conv.is_favorite;
    if (activeTab === "groups") return conv.is_group;
    return true;
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="w-80 h-screen bg-sidebar flex flex-col border-r border-sidebar-border">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 bg-primary">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {profile?.display_name?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-sidebar-foreground">Chats</h2>
              <span className="text-xs text-primary flex items-center gap-1">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                Online
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-sidebar-muted hover:text-sidebar-foreground"
              onClick={() => setNewChatOpen(true)}
            >
              <Edit className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-sidebar-muted hover:text-sidebar-foreground">
              <Bell className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-sidebar-muted hover:text-sidebar-foreground"
              onClick={() => navigate("/profile")}
            >
              <User className="w-5 h-5" />
            </Button>
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
            placeholder="Search conversations..."
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
          All
        </Button>
        <Button
          variant={activeTab === "favorites" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("favorites")}
          className={activeTab === "favorites" ? "" : "text-sidebar-muted hover:text-sidebar-foreground"}
        >
          <Star className="w-4 h-4 mr-1" />
          Favorites
        </Button>
        <Button
          variant={activeTab === "groups" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("groups")}
          className={activeTab === "groups" ? "" : "text-sidebar-muted hover:text-sidebar-foreground"}
        >
          <Users className="w-4 h-4 mr-1" />
          Groups
        </Button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-sidebar-muted">
            <Users className="w-12 h-12 mb-2 opacity-50" />
            <p>No conversations found</p>
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
                    {conv.name?.[0]?.toUpperCase() || "C"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sidebar-foreground truncate">
                    {conv.name || "Chat"}
                  </h3>
                  <p className="text-sm text-sidebar-muted truncate">
                    Click to view messages
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

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
          <Button variant="ghost" size="icon" className="text-sidebar-muted hover:text-sidebar-foreground">
            <Languages className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-sidebar-muted hover:text-sidebar-foreground">
            <Moon className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <NewChatDialog open={newChatOpen} onOpenChange={setNewChatOpen} onConversationCreated={onSelectConversation} />
    </div>
  );
};

export default ChatSidebar;
