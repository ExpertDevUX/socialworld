import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  User,
  FileText, 
  Megaphone, 
  ArrowLeft,
  Shield,
  Search,
  MoreVertical,
  Plus,
  Trash2,
  Edit,
  Power,
  BarChart3,
  MessageSquare,
  TrendingUp,
  CheckSquare,
  History,
  UserX,
  UserPlus
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useIsAdmin, useAllUserRoles, useAssignRole, useRemoveRole, AppRole } from "@/hooks/useRoles";
import { useAllProfiles } from "@/hooks/useProfile";
import { usePosts, useDeletePost } from "@/hooks/usePosts";
import { 
  useAllAdvertisements, 
  useCreateAdvertisement, 
  useUpdateAdvertisement, 
  useDeleteAdvertisement 
} from "@/hooks/useAdvertisements";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useActivityLogs, useLogActivity } from "@/hooks/useActivityLogs";
import Header from "@/components/Header";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format } from "date-fns";

const Admin = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isLoading } = useIsAdmin();
  
  const [userSearch, setUserSearch] = useState("");
  const [adDialogOpen, setAdDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<any>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkRole, setBulkRole] = useState<AppRole | "none">("none");

  // Hooks for data
  const { data: profiles = [] } = useAllProfiles();
  const { data: userRoles = [] } = useAllUserRoles();
  const { data: posts = [] } = usePosts();
  const { data: advertisements = [] } = useAllAdvertisements();
  const { data: analytics } = useAnalytics();
  const { data: activityLogs = [] } = useActivityLogs();
  
  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();
  const deletePost = useDeletePost();
  const createAd = useCreateAdvertisement();
  const updateAd = useUpdateAdvertisement();
  const deleteAd = useDeleteAdvertisement();
  const logActivity = useLogActivity();

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))'];

  // Ad form state
  const [adForm, setAdForm] = useState({
    title: "",
    description: "",
    image_url: "",
    link_url: "",
    placement: "sidebar",
    priority: 0,
    is_active: true,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">{t("admin.accessDenied")}</h1>
            <p className="text-muted-foreground mb-4">{t("admin.noPermission")}</p>
            <Button onClick={() => navigate("/chat")}>{t("common.back")}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredProfiles = profiles.filter(
    (p) =>
      p.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      p.display_name.toLowerCase().includes(userSearch.toLowerCase())
  );

  const getUserRole = (userId: string): AppRole | null => {
    const role = userRoles.find((r) => r.user_id === userId);
    return role?.role || null;
  };

  const handleRoleChange = async (userId: string, role: AppRole | "none") => {
    const profile = profiles.find(p => p.user_id === userId);
    try {
      if (role === "none") {
        await removeRole.mutateAsync(userId);
        await logActivity.mutateAsync({
          actionType: 'role_removed',
          targetType: 'user',
          targetId: userId,
          details: { username: profile?.username }
        });
      } else {
        await assignRole.mutateAsync({ userId, role });
        await logActivity.mutateAsync({
          actionType: 'role_assigned',
          targetType: 'user',
          targetId: userId,
          details: { username: profile?.username, role }
        });
      }
      toast({ title: t("common.success"), description: t("admin.roleUpdated") });
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredProfiles.map(p => p.user_id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleBulkRoleChange = async () => {
    if (selectedUsers.length === 0) return;
    
    try {
      const affectedUsers = profiles
        .filter(p => selectedUsers.includes(p.user_id))
        .map(p => p.username);

      for (const userId of selectedUsers) {
        if (bulkRole === "none") {
          await removeRole.mutateAsync(userId);
        } else {
          await assignRole.mutateAsync({ userId, role: bulkRole });
        }
      }

      await logActivity.mutateAsync({
        actionType: bulkRole === "none" ? 'bulk_role_removed' : 'bulk_role_assigned',
        targetType: 'multiple',
        details: { 
          userCount: selectedUsers.length,
          usernames: affectedUsers,
          role: bulkRole === "none" ? null : bulkRole
        }
      });

      toast({ 
        title: t("common.success"), 
        description: t("admin.bulkRoleUpdated", { count: selectedUsers.length }) 
      });
      setSelectedUsers([]);
      setBulkRole("none");
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost.mutateAsync(postId);
      await logActivity.mutateAsync({
        actionType: 'post_deleted',
        targetType: 'post',
        targetId: postId
      });
      toast({ title: t("common.success"), description: t("admin.postDeleted") });
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    }
  };

  const handleSaveAd = async () => {
    try {
      if (editingAd) {
        await updateAd.mutateAsync({ id: editingAd.id, ...adForm });
        await logActivity.mutateAsync({
          actionType: 'ad_updated',
          targetType: 'advertisement',
          targetId: editingAd.id,
          details: { title: adForm.title }
        });
      } else {
        const result = await createAd.mutateAsync({ ...adForm, created_by: null });
        await logActivity.mutateAsync({
          actionType: 'ad_created',
          targetType: 'advertisement',
          targetId: result.id,
          details: { title: adForm.title }
        });
      }
      setAdDialogOpen(false);
      setEditingAd(null);
      setAdForm({
        title: "",
        description: "",
        image_url: "",
        link_url: "",
        placement: "sidebar",
        priority: 0,
        is_active: true,
      });
      toast({ title: t("common.success"), description: t("admin.adSaved") });
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    }
  };

  const handleEditAd = (ad: any) => {
    setEditingAd(ad);
    setAdForm({
      title: ad.title,
      description: ad.description || "",
      image_url: ad.image_url || "",
      link_url: ad.link_url || "",
      placement: ad.placement,
      priority: ad.priority,
      is_active: ad.is_active,
    });
    setAdDialogOpen(true);
  };

  const handleDeleteAd = async (id: string) => {
    const ad = advertisements.find(a => a.id === id);
    try {
      await deleteAd.mutateAsync(id);
      await logActivity.mutateAsync({
        actionType: 'ad_deleted',
        targetType: 'advertisement',
        targetId: id,
        details: { title: ad?.title }
      });
      toast({ title: t("common.success"), description: t("admin.adDeleted") });
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    }
  };

  const handleToggleAd = async (id: string, isActive: boolean) => {
    try {
      await updateAd.mutateAsync({ id, is_active: !isActive });
      toast({ title: t("common.success") });
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'role_assigned':
      case 'bulk_role_assigned':
        return <UserPlus className="w-4 h-4 text-green-500" />;
      case 'role_removed':
      case 'bulk_role_removed':
        return <UserX className="w-4 h-4 text-orange-500" />;
      case 'post_deleted':
        return <Trash2 className="w-4 h-4 text-destructive" />;
      case 'ad_created':
        return <Plus className="w-4 h-4 text-green-500" />;
      case 'ad_updated':
        return <Edit className="w-4 h-4 text-blue-500" />;
      case 'ad_deleted':
        return <Trash2 className="w-4 h-4 text-destructive" />;
      default:
        return <History className="w-4 h-4" />;
    }
  };

  const getActionDescription = (log: any) => {
    const details = log.details || {};
    switch (log.action_type) {
      case 'role_assigned':
        return t("admin.logRoleAssigned", { username: details.username, role: details.role });
      case 'role_removed':
        return t("admin.logRoleRemoved", { username: details.username });
      case 'bulk_role_assigned':
        return t("admin.logBulkRoleAssigned", { count: details.userCount, role: details.role });
      case 'bulk_role_removed':
        return t("admin.logBulkRoleRemoved", { count: details.userCount });
      case 'post_deleted':
        return t("admin.logPostDeleted");
      case 'ad_created':
        return t("admin.logAdCreated", { title: details.title });
      case 'ad_updated':
        return t("admin.logAdUpdated", { title: details.title });
      case 'ad_deleted':
        return t("admin.logAdDeleted", { title: details.title });
      default:
        return log.action_type;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t("admin.title")}</h1>
            <p className="text-muted-foreground">{t("admin.subtitle")}</p>
          </div>
        </div>

        <Tabs defaultValue="analytics" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              {t("admin.analytics")}
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t("admin.users")}
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {t("admin.content")}
            </TabsTrigger>
            <TabsTrigger value="ads" className="flex items-center gap-2">
              <Megaphone className="w-4 h-4" />
              {t("admin.ads")}
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              {t("admin.activityLogs")}
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{t("admin.totalUsers")}</CardTitle>
                  <Users className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.totalUsers || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{t("admin.totalPosts")}</CardTitle>
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.totalPosts || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{t("admin.totalMessages")}</CardTitle>
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.totalMessages || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{t("admin.activeAds")}</CardTitle>
                  <Megaphone className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.activeAds || 0}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    {t("admin.userGrowth")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={analytics?.userGrowth || []}>
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {t("admin.postActivity")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={analytics?.postActivity || []}>
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    {t("admin.roleDistribution")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={analytics?.roleDistribution || []}
                        dataKey="count"
                        nameKey="role"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ role, count }) => `${role}: ${count}`}
                      >
                        {(analytics?.roleDistribution || []).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("admin.quickStats")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t("admin.totalConversations")}</span>
                    <span className="font-bold">{analytics?.totalConversations || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t("admin.adminCount")}</span>
                    <span className="font-bold">{analytics?.roleDistribution?.find(r => r.role === 'admin')?.count || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t("admin.moderatorCount")}</span>
                    <span className="font-bold">{analytics?.roleDistribution?.find(r => r.role === 'moderator')?.count || 0}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.userManagement")}</CardTitle>
                <p className="text-sm text-muted-foreground">{t("admin.userManagementDesc")}</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={t("users.searchUsers")}
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                {/* Bulk Actions */}
                {selectedUsers.length > 0 && (
                  <div className="flex items-center gap-3 mt-4 p-3 bg-muted rounded-lg">
                    <CheckSquare className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">
                      {t("admin.selectedUsers", { count: selectedUsers.length })}
                    </span>
                    <Select value={bulkRole} onValueChange={(v) => setBulkRole(v as AppRole | "none")}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder={t("admin.selectRole")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t("admin.noRole")}</SelectItem>
                        <SelectItem value="user">{t("admin.roleUser")}</SelectItem>
                        <SelectItem value="moderator">{t("admin.roleModerator")}</SelectItem>
                        <SelectItem value="admin">{t("admin.roleAdmin")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={handleBulkRoleChange}>
                      {t("admin.applyBulkAction")}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedUsers([])}>
                      {t("common.cancel")}
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {/* Select All */}
                  <div className="flex items-center gap-3 p-2 border-b">
                    <Checkbox
                      checked={selectedUsers.length === filteredProfiles.length && filteredProfiles.length > 0}
                      onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                    />
                    <span className="text-sm text-muted-foreground">{t("admin.selectAll")}</span>
                  </div>
                  {filteredProfiles.map((profile) => {
                    const role = getUserRole(profile.user_id);
                    const isSelected = selectedUsers.includes(profile.user_id);
                    return (
                      <div
                        key={profile.id}
                        className={`flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors ${isSelected ? 'bg-accent/30 border-primary' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectUser(profile.user_id, checked as boolean)}
                          />
                          <Avatar>
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {profile.display_name[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{profile.display_name}</p>
                            <p className="text-sm text-muted-foreground">@{profile.username}</p>
                          </div>
                          {role && (
                            <Badge variant={role === "admin" ? "default" : role === "moderator" ? "secondary" : "outline"}>
                              {role}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={role || "none"}
                            onValueChange={(value) => handleRoleChange(profile.user_id, value as AppRole | "none")}
                          >
                            <SelectTrigger className="w-36">
                              <Shield className="w-4 h-4 mr-2" />
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                <span className="flex items-center gap-2">
                                  <Users className="w-4 h-4" />
                                  {t("admin.noRole")}
                                </span>
                              </SelectItem>
                              <SelectItem value="user">
                                <span className="flex items-center gap-2">
                                  <User className="w-4 h-4" />
                                  {t("admin.roleUser")}
                                </span>
                              </SelectItem>
                              <SelectItem value="moderator">
                                <span className="flex items-center gap-2">
                                  <Shield className="w-4 h-4" />
                                  {t("admin.roleModerator")}
                                </span>
                              </SelectItem>
                              <SelectItem value="admin">
                                <span className="flex items-center gap-2">
                                  <Shield className="w-4 h-4 text-primary" />
                                  {t("admin.roleAdmin")}
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/profile/${profile.user_id}`)}>
                                <Edit className="w-4 h-4 mr-2" />
                                {t("admin.viewProfile")}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleRoleChange(profile.user_id, "none")}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {t("admin.removeRole")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                  {filteredProfiles.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      {t("users.noUsersFound")}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.contentManagement")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {posts.map((post) => {
                    const author = profiles.find((p) => p.user_id === post.user_id);
                    return (
                      <div
                        key={post.id}
                        className="flex items-start justify-between p-3 rounded-lg border"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{author?.display_name || "Unknown"}</span>
                            <span className="text-sm text-muted-foreground">
                              {new Date(post.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm line-clamp-2">{post.content}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() => handleDeletePost(post.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {t("common.delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    );
                  })}
                  {posts.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      {t("admin.noPosts")}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ads Tab */}
          <TabsContent value="ads">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>{t("admin.adManagement")}</CardTitle>
                <Dialog open={adDialogOpen} onOpenChange={setAdDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setEditingAd(null);
                      setAdForm({
                        title: "",
                        description: "",
                        image_url: "",
                        link_url: "",
                        placement: "sidebar",
                        priority: 0,
                        is_active: true,
                      });
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      {t("admin.createAd")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingAd ? t("admin.editAd") : t("admin.createAd")}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>{t("admin.adTitle")}</Label>
                        <Input
                          value={adForm.title}
                          onChange={(e) => setAdForm({ ...adForm, title: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>{t("admin.adDescription")}</Label>
                        <Textarea
                          value={adForm.description}
                          onChange={(e) => setAdForm({ ...adForm, description: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>{t("admin.adImageUrl")}</Label>
                        <Input
                          value={adForm.image_url}
                          onChange={(e) => setAdForm({ ...adForm, image_url: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <Label>{t("admin.adLinkUrl")}</Label>
                        <Input
                          value={adForm.link_url}
                          onChange={(e) => setAdForm({ ...adForm, link_url: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <Label>{t("admin.adPlacement")}</Label>
                        <Select
                          value={adForm.placement}
                          onValueChange={(v) => setAdForm({ ...adForm, placement: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sidebar">{t("admin.placementSidebar")}</SelectItem>
                            <SelectItem value="banner">{t("admin.placementBanner")}</SelectItem>
                            <SelectItem value="inline">{t("admin.placementInline")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>{t("admin.adPriority")}</Label>
                        <Input
                          type="number"
                          value={adForm.priority}
                          onChange={(e) => setAdForm({ ...adForm, priority: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={adForm.is_active}
                          onCheckedChange={(checked) => setAdForm({ ...adForm, is_active: checked })}
                        />
                        <Label>{t("admin.adActive")}</Label>
                      </div>
                      <Button onClick={handleSaveAd} className="w-full">
                        {t("common.save")}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {advertisements.map((ad) => (
                    <div
                      key={ad.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        {ad.image_url && (
                          <img
                            src={ad.image_url}
                            alt={ad.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="font-medium">{ad.title}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{ad.placement}</Badge>
                            <Badge variant={ad.is_active ? "default" : "secondary"}>
                              {ad.is_active ? t("admin.active") : t("admin.inactive")}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleAd(ad.id, ad.is_active)}
                        >
                          <Power className={`w-4 h-4 ${ad.is_active ? "text-green-500" : "text-muted-foreground"}`} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEditAd(ad)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAd(ad.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {advertisements.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      {t("admin.noAds")}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Logs Tab */}
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  {t("admin.activityLogs")}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{t("admin.activityLogsDesc")}</p>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {activityLogs.map((log) => {
                      const admin = profiles.find(p => p.user_id === log.admin_id);
                      return (
                        <div
                          key={log.id}
                          className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/30 transition-colors"
                        >
                          <div className="mt-1">
                            {getActionIcon(log.action_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              <span className="font-medium">{admin?.display_name || "Admin"}</span>
                              {" "}
                              <span className="text-muted-foreground">{getActionDescription(log)}</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(log.created_at), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                          </div>
                          <Badge variant="outline" className="shrink-0">
                            {log.target_type}
                          </Badge>
                        </div>
                      );
                    })}
                    {activityLogs.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        {t("admin.noActivityLogs")}
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
