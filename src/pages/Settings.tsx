import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Languages, 
  Moon,
  User,
  Key,
  Phone,
  Shield,
  Monitor,
  Eye,
  Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";

type SettingsSection = "profile" | "password" | "phone" | "2fa" | "sessions" | "privacy" | "appearance";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [username, setUsername] = useState(profile?.username || "");

  // Update local state when profile loads
  useState(() => {
    if (profile) {
      setDisplayName(profile.display_name);
      setUsername(profile.username);
    }
  });

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync({
        display_name: displayName,
        username: username,
      });
      toast({
        title: "Profile updated",
        description: "Your changes have been saved",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const settingsMenu = [
    { id: "profile" as const, icon: User, label: "Profile Information", desc: "Update your personal inform..." },
    { id: "password" as const, icon: Key, label: "Password", desc: "Change your password" },
    { id: "phone" as const, icon: Phone, label: "Phone Number", desc: "Not set" },
    { id: "2fa" as const, icon: Shield, label: "Two-Factor Auth", desc: "Add extra security with 2FA" },
    { id: "sessions" as const, icon: Monitor, label: "Active Sessions", desc: "Manage your login sessions" },
    { id: "privacy" as const, icon: Eye, label: "Privacy", desc: "Control who can see your pro..." },
  ];

  const preferencesMenu = [
    { id: "appearance" as const, icon: Palette, label: "Appearance", desc: "Customize how ChatFlow looks" },
  ];

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
          <h1 className="text-xl font-bold text-sidebar-foreground">Settings</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-sidebar-muted">
            <Languages className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-sidebar-muted">
            <Moon className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="flex gap-6 p-6">
        {/* Left Sidebar - Settings Menu */}
        <div className="w-80 space-y-4">
          {/* User Card */}
          <Card className="bg-sidebar-accent border-sidebar-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="w-14 h-14">
                    <AvatarFallback className="bg-primary/20 text-primary text-xl">
                      <User className="w-6 h-6" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 w-4 h-4 bg-primary rounded-full border-2 border-sidebar-accent flex items-center justify-center">
                    <User className="w-2 h-2 text-primary-foreground" />
                  </span>
                </div>
                <div>
                  <h2 className="font-bold text-sidebar-foreground">{profile?.display_name}</h2>
                  <p className="text-sidebar-muted text-sm">@{profile?.username}</p>
                  <span className="inline-flex items-center gap-1 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full mt-1">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    Online
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card className="bg-sidebar-accent border-sidebar-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-sidebar-muted uppercase">Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 p-2">
              {settingsMenu.map((item) => (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? "default" : "ghost"}
                  className="w-full justify-start h-auto py-3"
                  onClick={() => setActiveSection(item.id)}
                >
                  <item.icon className="w-5 h-5 mr-3 shrink-0" />
                  <div className="text-left min-w-0">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card className="bg-sidebar-accent border-sidebar-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-sidebar-muted uppercase">Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 p-2">
              {preferencesMenu.map((item) => (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? "default" : "ghost"}
                  className="w-full justify-start h-auto py-3"
                  onClick={() => setActiveSection(item.id)}
                >
                  <item.icon className="w-5 h-5 mr-3 shrink-0" />
                  <div className="text-left min-w-0">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {activeSection === "profile" && (
            <Card className="bg-sidebar-accent border-sidebar-border">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sidebar-foreground">Profile Information</CardTitle>
                    <p className="text-sm text-sidebar-muted">Update your personal information</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sidebar-foreground">Display Name</Label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-sidebar border-sidebar-border text-sidebar-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sidebar-foreground">Username</Label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-sidebar border-sidebar-border text-sidebar-foreground"
                  />
                </div>

                <Button 
                  className="w-full"
                  onClick={handleSaveProfile}
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          )}

          {activeSection === "password" && (
            <Card className="bg-sidebar-accent border-sidebar-border">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Key className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sidebar-foreground">Change Password</CardTitle>
                    <p className="text-sm text-sidebar-muted">Update your password</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sidebar-foreground">Current Password</Label>
                  <Input
                    type="password"
                    className="bg-sidebar border-sidebar-border text-sidebar-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sidebar-foreground">New Password</Label>
                  <Input
                    type="password"
                    className="bg-sidebar border-sidebar-border text-sidebar-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sidebar-foreground">Confirm New Password</Label>
                  <Input
                    type="password"
                    className="bg-sidebar border-sidebar-border text-sidebar-foreground"
                  />
                </div>

                <Button className="w-full">
                  Update Password
                </Button>
              </CardContent>
            </Card>
          )}

          {activeSection === "phone" && (
            <Card className="bg-sidebar-accent border-sidebar-border">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sidebar-foreground">Phone Number</CardTitle>
                    <p className="text-sm text-sidebar-muted">Add or update your phone number</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sidebar-foreground">Phone Number</Label>
                  <Input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    className="bg-sidebar border-sidebar-border text-sidebar-foreground"
                  />
                </div>

                <Button className="w-full">
                  Save Phone Number
                </Button>
              </CardContent>
            </Card>
          )}

          {activeSection === "2fa" && (
            <Card className="bg-sidebar-accent border-sidebar-border">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sidebar-foreground">Two-Factor Authentication</CardTitle>
                    <p className="text-sm text-sidebar-muted">Add extra security to your account</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sidebar-muted mb-4">
                  Two-factor authentication adds an extra layer of security to your account. 
                  You'll need to enter a code from your authenticator app in addition to your password.
                </p>
                <Button className="w-full">
                  Enable Two-Factor Auth
                </Button>
              </CardContent>
            </Card>
          )}

          {activeSection === "sessions" && (
            <Card className="bg-sidebar-accent border-sidebar-border">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Monitor className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sidebar-foreground">Active Sessions</CardTitle>
                    <p className="text-sm text-sidebar-muted">Manage your login sessions</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-sidebar rounded-lg mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Monitor className="w-8 h-8 text-primary" />
                      <div>
                        <p className="font-medium text-sidebar-foreground">Current Session</p>
                        <p className="text-sm text-sidebar-muted">This device</p>
                      </div>
                    </div>
                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Active</span>
                  </div>
                </div>
                <Button variant="destructive" className="w-full">
                  Sign Out All Other Sessions
                </Button>
              </CardContent>
            </Card>
          )}

          {activeSection === "privacy" && (
            <Card className="bg-sidebar-accent border-sidebar-border">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Eye className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sidebar-foreground">Privacy Settings</CardTitle>
                    <p className="text-sm text-sidebar-muted">Control who can see your profile</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sidebar-muted">
                  Privacy settings coming soon. You'll be able to control who can see your profile, 
                  online status, and more.
                </p>
              </CardContent>
            </Card>
          )}

          {activeSection === "appearance" && (
            <Card className="bg-sidebar-accent border-sidebar-border">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Palette className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sidebar-foreground">Appearance</CardTitle>
                    <p className="text-sm text-sidebar-muted">Customize how ChatFlow looks</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sidebar-muted">
                  Theme and appearance settings coming soon. You'll be able to customize colors, 
                  fonts, and more.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
