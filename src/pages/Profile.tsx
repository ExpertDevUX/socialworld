import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Bell, 
  Languages, 
  Settings,
  FileText,
  Star,
  Bookmark,
  UserPlus,
  Image,
  Video,
  Send,
  Heart,
  ThumbsUp,
  Smile,
  Frown,
  Plus,
  MessageCircle,
  Share2,
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useProfile } from "@/hooks/useProfile";
import { usePosts, useCreatePost, usePostReactions, useToggleReaction, useToggleSavePost } from "@/hooks/usePosts";
import { useFriendships, useFriendRequests } from "@/hooks/useFriendships";
import { useAuth } from "@/contexts/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import DocumentsSection from "@/components/DocumentsSection";
import FindFriendsDialog from "@/components/FindFriendsDialog";
import FriendRequestsSection from "@/components/FriendRequestsSection";
import FriendsListSection from "@/components/FriendsListSection";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: posts = [] } = usePosts(user?.id);
  const { data: friendships = [] } = useFriendships();
  const { data: friendRequests = [] } = useFriendRequests();
  const createPost = useCreatePost();
  
  const [activeSection, setActiveSection] = useState<"feed" | "saved" | "documents">("feed");
  const [newPostContent, setNewPostContent] = useState("");
  const [findFriendsOpen, setFindFriendsOpen] = useState(false);

  const acceptedFriends = friendships.filter(f => f.status === "accepted");

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    
    try {
      await createPost.mutateAsync({ content: newPostContent });
      setNewPostContent("");
    } catch (error) {
      console.error("Failed to create post:", error);
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
    <div className="min-h-screen bg-sidebar">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/chat")}
            className="text-sidebar-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-sidebar-foreground">Profile</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-sidebar-muted">
            <Bell className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-sidebar-muted">
            <Languages className="w-5 h-5" />
          </Button>
          <ThemeToggle />
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-sidebar-muted"
            onClick={() => navigate("/settings")}
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="flex gap-6 p-6">
        {/* Left Sidebar - Profile Info */}
        <div className="w-80 space-y-4">
          <Card className="bg-sidebar-accent border-sidebar-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {profile?.display_name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-sidebar-accent ${getStatusColor(profile?.status)}`}></span>
                </div>
                <div>
                  <h2 className="font-bold text-sidebar-foreground text-lg">{profile?.display_name}</h2>
                  <p className="text-sidebar-muted">@{profile?.username}</p>
                  <span className="inline-flex items-center gap-1 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full mt-1 capitalize">
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(profile?.status)}`}></span>
                    {profile?.status || "online"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center border-t border-sidebar-border pt-4">
                <div>
                  <p className="text-xl font-bold text-sidebar-foreground">{acceptedFriends.length}</p>
                  <p className="text-sm text-sidebar-muted">Friends</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-sidebar-foreground">{posts.length}</p>
                  <p className="text-sm text-sidebar-muted">Posts</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-sidebar-foreground">{friendRequests.length}</p>
                  <p className="text-sm text-sidebar-muted">Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Navigation */}
          <Card className="bg-sidebar-accent border-sidebar-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-sidebar-muted uppercase">Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <Button
                variant={activeSection === "feed" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveSection("feed")}
              >
                <FileText className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Feed</p>
                  <p className="text-xs text-muted-foreground">View and create posts</p>
                </div>
              </Button>
              <Button
                variant={activeSection === "saved" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveSection("saved")}
              >
                <Bookmark className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Saved Posts</p>
                  <p className="text-xs text-muted-foreground">View your saved posts</p>
                </div>
              </Button>
              <Button
                variant={activeSection === "documents" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveSection("documents")}
              >
                <FileText className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">My Documents</p>
                  <p className="text-xs text-muted-foreground">Upload and manage files</p>
                </div>
              </Button>
            </CardContent>
          </Card>

          {/* Social */}
          <Card className="bg-sidebar-accent border-sidebar-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-sidebar-muted uppercase">Social</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => setFindFriendsOpen(true)}
              >
                <UserPlus className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Find Friends</p>
                  <p className="text-xs text-muted-foreground">Connect with others</p>
                </div>
              </Button>
            </CardContent>
          </Card>

          {/* Friends List Section */}
          <FriendsListSection />

          {/* Friend Requests Section */}
          <FriendRequestsSection />

          {/* Find Friends Dialog */}
          <FindFriendsDialog 
            open={findFriendsOpen} 
            onOpenChange={setFindFriendsOpen} 
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-4">
          {activeSection === "documents" ? (
            <DocumentsSection />
          ) : (
            <>
              <Card className="bg-sidebar-accent border-sidebar-border">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <CardTitle className="text-sidebar-foreground">
                      {activeSection === "feed" ? "Feed" : "Saved Posts"}
                    </CardTitle>
                  </div>
                  <p className="text-sm text-sidebar-muted">
                    {activeSection === "feed" ? "View and create posts" : "Your saved posts"}
                  </p>
                </CardHeader>
              </Card>

              {activeSection === "feed" && (
                <Card className="bg-sidebar-accent border-sidebar-border">
                  <CardContent className="pt-4">
                    <div className="flex gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {profile?.display_name?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Textarea
                          placeholder="What's on your mind?"
                          value={newPostContent}
                          onChange={(e) => setNewPostContent(e.target.value)}
                          className="bg-sidebar border-sidebar-border text-sidebar-foreground resize-none mb-3"
                          rows={2}
                        />
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="text-sidebar-muted">
                              <Image className="w-4 h-4 mr-1" />
                              Photo
                            </Button>
                            <Button variant="ghost" size="sm" className="text-sidebar-muted">
                              <Video className="w-4 h-4 mr-1" />
                              Video
                            </Button>
                          </div>
                          <Button onClick={handleCreatePost} disabled={!newPostContent.trim()}>
                            <Send className="w-4 h-4 mr-1" />
                            Post
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Posts */}
              {posts.map((post) => (
                <PostCard key={post.id} post={post} profile={profile} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

function PostCard({ post, profile }: { post: any; profile: any }) {
  const { data: reactions = [] } = usePostReactions(post.id);
  const toggleReaction = useToggleReaction();
  const toggleSave = useToggleSavePost();
  const { user } = useAuth();

  const reactionCounts = {
    like: reactions.filter(r => r.reaction === "like").length,
    love: reactions.filter(r => r.reaction === "love").length,
    laugh: reactions.filter(r => r.reaction === "laugh").length,
    sad: reactions.filter(r => r.reaction === "sad").length,
  };

  const totalReactions = reactions.length;
  const userReaction = reactions.find(r => r.user_id === user?.id);

  const handleReaction = (reaction: string) => {
    toggleReaction.mutate({ postId: post.id, reaction });
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "just now";
    if (hours < 24) return `about ${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  return (
    <Card className="bg-sidebar-accent border-sidebar-border">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {profile?.display_name?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-medium text-sidebar-foreground">{profile?.display_name}</h4>
              <p className="text-sm text-sidebar-muted">
                @{profile?.username} · {timeAgo(post.created_at)}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-sidebar-muted">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-sidebar-foreground mb-4">{post.content}</p>

        {totalReactions > 0 && (
          <div className="flex items-center gap-2 text-sm text-sidebar-muted mb-3">
            <ThumbsUp className="w-4 h-4 text-primary" />
            <span>{totalReactions} reaction{totalReactions !== 1 ? "s" : ""}</span>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-sidebar-border pt-3">
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleReaction("love")}
              className={userReaction?.reaction === "love" ? "text-red-500" : "text-sidebar-muted"}
            >
              <Heart className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleReaction("like")}
              className={userReaction?.reaction === "like" ? "text-primary" : "text-sidebar-muted"}
            >
              <ThumbsUp className="w-4 h-4" />
              {reactionCounts.like > 0 && <span className="ml-1">{reactionCounts.like}</span>}
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleReaction("laugh")}
              className={userReaction?.reaction === "laugh" ? "text-yellow-500" : "text-sidebar-muted"}
            >
              <Smile className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleReaction("sad")}
              className={userReaction?.reaction === "sad" ? "text-yellow-500" : "text-sidebar-muted"}
            >
              <Frown className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-sidebar-muted">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="text-sidebar-muted">
              <MessageCircle className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-sidebar-muted">
              <Share2 className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-sidebar-muted"
              onClick={() => toggleSave.mutate(post.id)}
            >
              <Bookmark className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProfilePage;
