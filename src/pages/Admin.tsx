import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
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
  TrendingUp
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import Header from "@/components/Header";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const Admin = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isLoading } = useIsAdmin();
  
  const [userSearch, setUserSearch] = useState("");
  const [adDialogOpen, setAdDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<any>(null);

  // Hooks for data
  const { data: profiles = [] } = useAllProfiles();
  const { data: userRoles = [] } = useAllUserRoles();
  const { data: posts = [] } = usePosts();
  const { data: advertisements = [] } = useAllAdvertisements();
  const { data: analytics } = useAnalytics();
  
  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();
  const deletePost = useDeletePost();
  const createAd = useCreateAdvertisement();
  const updateAd = useUpdateAdvertisement();
  const deleteAd = useDeleteAdvertisement();

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
    try {
      if (role === "none") {
        await removeRole.mutateAsync(userId);
      } else {
        await assignRole.mutateAsync({ userId, role });
      }
      toast({ title: t("common.success"), description: t("admin.roleUpdated") });
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost.mutateAsync(postId);
      toast({ title: t("common.success"), description: t("admin.postDeleted") });
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    }
  };

  const handleSaveAd = async () => {
    try {
      if (editingAd) {
        await updateAd.mutateAsync({ id: editingAd.id, ...adForm });
      } else {
        await createAd.mutateAsync({ ...adForm, created_by: null });
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
    try {
      await deleteAd.mutateAsync(id);
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
          <TabsList className="grid w-full grid-cols-4">
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
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={t("users.searchUsers")}
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredProfiles.map((profile) => {
                    const role = getUserRole(profile.user_id);
                    return (
                      <div
                        key={profile.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
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
                            <Badge variant={role === "admin" ? "default" : "secondary"}>
                              {role}
                            </Badge>
                          )}
                        </div>
                        <Select
                          value={role || "none"}
                          onValueChange={(value) => handleRoleChange(profile.user_id, value as AppRole | "none")}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">{t("admin.noRole")}</SelectItem>
                            <SelectItem value="user">{t("admin.roleUser")}</SelectItem>
                            <SelectItem value="moderator">{t("admin.roleModerator")}</SelectItem>
                            <SelectItem value="admin">{t("admin.roleAdmin")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
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
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
