import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  User,
  Key,
  Phone,
  Shield,
  Monitor,
  Eye,
  Palette,
  Sun,
  Moon,
  CheckCircle2,
  Megaphone,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { usePhoneVerification } from "@/hooks/usePhoneVerification";
import { useUserRole } from "@/hooks/useRoles";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSelector from "@/components/LanguageSelector";

type SettingsSection = "profile" | "password" | "phone" | "2fa" | "sessions" | "privacy" | "appearance" | "ads" | "permissions";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: profile } = useProfile();
  const { data: userRole } = useUserRole();
  const updateProfile = useUpdateProfile();
  const phoneVerification = usePhoneVerification();
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState("online");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showAds, setShowAds] = useState(true);

  // Update local state when profile loads
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name);
      setUsername(profile.username);
      setStatus(profile.status || "online");
      setShowAds(profile.show_ads ?? true);
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync({
        display_name: displayName,
        username: username,
        status: status,
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

  const getStatusColor = (statusValue: string) => {
    switch (statusValue) {
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

  const settingsMenu = [
    { id: "profile" as const, icon: User, label: "Profile Information", desc: "Update your personal inform..." },
    { id: "password" as const, icon: Key, label: "Password", desc: "Change your password" },
    { id: "phone" as const, icon: Phone, label: "Phone Number", desc: profile?.phone_number || "Not set" },
    { id: "2fa" as const, icon: Shield, label: "Two-Factor Auth", desc: "Add extra security with 2FA" },
    { id: "sessions" as const, icon: Monitor, label: "Active Sessions", desc: "Manage your login sessions" },
    { id: "privacy" as const, icon: Eye, label: "Privacy", desc: "Control who can see your pro..." },
  ];

  const preferencesMenu = [
    { id: "appearance" as const, icon: Palette, label: "Appearance", desc: "Customize how ChatFlow looks" },
    { id: "ads" as const, icon: Megaphone, label: "Advertisements", desc: "Control ad display" },
    { id: "permissions" as const, icon: Lock, label: "Permissions", desc: userRole?.role ? `Role: ${userRole.role}` : "View your permissions" },
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
          <LanguageSelector />
          <ThemeToggle />
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
                      {profile?.display_name?.[0]?.toUpperCase() || <User className="w-6 h-6" />}
                    </AvatarFallback>
                  </Avatar>
                  <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-sidebar-accent ${getStatusColor(status)}`}></span>
                </div>
                <div>
                  <h2 className="font-bold text-sidebar-foreground">{profile?.display_name}</h2>
                  <p className="text-sidebar-muted text-sm">@{profile?.username}</p>
                  <span className="inline-flex items-center gap-1 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full mt-1 capitalize">
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(status)}`}></span>
                    {status}
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
                  className="w-full justify-start h-auto py-3 group"
                  onClick={() => setActiveSection(item.id)}
                >
                  <item.icon className="w-5 h-5 mr-3 shrink-0" />
                  <div className="text-left min-w-0">
                    <p className="font-medium">{item.label}</p>
                    <p className={`text-xs truncate transition-colors ${
                      activeSection === item.id 
                        ? 'text-primary-foreground/80' 
                        : 'text-muted-foreground group-hover:text-foreground'
                    }`}>{item.desc}</p>
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
                  className="w-full justify-start h-auto py-3 group"
                  onClick={() => setActiveSection(item.id)}
                >
                  <item.icon className="w-5 h-5 mr-3 shrink-0" />
                  <div className="text-left min-w-0">
                    <p className="font-medium">{item.label}</p>
                    <p className={`text-xs truncate transition-colors ${
                      activeSection === item.id 
                        ? 'text-primary-foreground/80' 
                        : 'text-muted-foreground group-hover:text-foreground'
                    }`}>{item.desc}</p>
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

                <div className="space-y-2">
                  <Label className="text-sidebar-foreground">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="bg-sidebar border-sidebar-border text-sidebar-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-sidebar border-sidebar-border">
                      <SelectItem value="online">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Online
                        </span>
                      </SelectItem>
                      <SelectItem value="away">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                          Away
                        </span>
                      </SelectItem>
                      <SelectItem value="busy">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          Busy
                        </span>
                      </SelectItem>
                      <SelectItem value="offline">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                          Offline
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
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
                    <p className="text-sm text-sidebar-muted">
                      {profile?.phone_number 
                        ? `Current: ${profile.phone_number}` 
                        : "Add or update your phone number"}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {profile?.phone_number && !phoneVerification.verificationSent && (
                  <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-green-500">Phone number verified</span>
                  </div>
                )}

                {phoneVerification.error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive">{phoneVerification.error}</p>
                  </div>
                )}

                {!phoneVerification.verificationSent ? (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sidebar-foreground">Phone Number</Label>
                      <Input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+1 555 000 0000"
                        className="bg-sidebar border-sidebar-border text-sidebar-foreground"
                      />
                      <p className="text-xs text-sidebar-muted">
                        Include country code (e.g., +1 for US)
                      </p>
                    </div>

                    <Button 
                      className="w-full"
                      onClick={async () => {
                        const result = await phoneVerification.sendVerificationCode(phoneNumber);
                        if (result.success) {
                          toast({
                            title: "Verification code sent",
                            description: "Check your phone for the verification code",
                          });
                        } else {
                          toast({
                            title: "Error",
                            description: result.error || "Failed to send verification code",
                            variant: "destructive",
                          });
                        }
                      }}
                      disabled={!phoneNumber || phoneVerification.isLoading}
                    >
                      {phoneVerification.isLoading ? "Sending..." : "Send Verification Code"}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sidebar-foreground">Verification Code</Label>
                      <Input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        className="bg-sidebar border-sidebar-border text-sidebar-foreground text-center text-lg tracking-widest"
                      />
                      <p className="text-xs text-sidebar-muted">
                        Enter the code sent to {phoneNumber}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          phoneVerification.resetState();
                          setVerificationCode("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        className="flex-1"
                        onClick={async () => {
                          const result = await phoneVerification.verifyCode(phoneNumber, verificationCode);
                          if (result.success) {
                            toast({
                              title: "Phone verified",
                              description: "Your phone number has been verified successfully",
                            });
                            setVerificationCode("");
                            setPhoneNumber("");
                          } else {
                            toast({
                              title: "Verification failed",
                              description: result.error || "Invalid verification code",
                              variant: "destructive",
                            });
                          }
                        }}
                        disabled={verificationCode.length < 6 || phoneVerification.isLoading}
                      >
                        {phoneVerification.isLoading ? "Verifying..." : "Verify"}
                      </Button>
                    </div>
                  </>
                )}
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
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-sidebar-foreground">Theme</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setTheme("light")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                        theme === "light" 
                          ? "border-primary bg-primary/10" 
                          : "border-sidebar-border hover:border-primary/50"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                        <Sun className="w-6 h-6 text-yellow-500" />
                      </div>
                      <span className="text-sm font-medium text-sidebar-foreground">Light</span>
                    </button>
                    <button
                      onClick={() => setTheme("dark")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                        theme === "dark" 
                          ? "border-primary bg-primary/10" 
                          : "border-sidebar-border hover:border-primary/50"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-lg bg-gray-900 border border-gray-700 flex items-center justify-center">
                        <Moon className="w-6 h-6 text-blue-400" />
                      </div>
                      <span className="text-sm font-medium text-sidebar-foreground">Dark</span>
                    </button>
                    <button
                      onClick={() => setTheme("system")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                        theme === "system" 
                          ? "border-primary bg-primary/10" 
                          : "border-sidebar-border hover:border-primary/50"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-white to-gray-900 border flex items-center justify-center">
                        <Monitor className="w-6 h-6 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-sidebar-foreground">System</span>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "ads" && (
            <Card className="bg-sidebar-accent border-sidebar-border">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sidebar-foreground">Advertisements</CardTitle>
                    <p className="text-sm text-sidebar-muted">Control advertisement display</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg border border-sidebar-border">
                  <div>
                    <p className="font-medium text-sidebar-foreground">Show Advertisements</p>
                    <p className="text-sm text-sidebar-muted">Enable or disable advertisements in your feed</p>
                  </div>
                  <Switch
                    checked={showAds}
                    onCheckedChange={async (checked) => {
                      setShowAds(checked);
                      try {
                        await updateProfile.mutateAsync({ show_ads: checked });
                        toast({
                          title: "Settings updated",
                          description: checked ? "Advertisements enabled" : "Advertisements disabled",
                        });
                      } catch (error) {
                        setShowAds(!checked);
                        toast({
                          title: "Error",
                          description: "Failed to update settings",
                          variant: "destructive",
                        });
                      }
                    }}
                  />
                </div>
                <p className="text-sm text-sidebar-muted">
                  Advertisements help support the platform. You can choose to disable them if you prefer an ad-free experience.
                </p>
              </CardContent>
            </Card>
          )}

          {activeSection === "permissions" && (
            <Card className="bg-sidebar-accent border-sidebar-border">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Lock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sidebar-foreground">Permissions & Privileges</CardTitle>
                    <p className="text-sm text-sidebar-muted">View your account permissions</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-lg border border-sidebar-border">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sidebar-foreground font-medium">Current Role</span>
                    <Badge variant={userRole?.role === 'admin' ? 'default' : userRole?.role === 'moderator' ? 'secondary' : 'outline'}>
                      {userRole?.role || 'Standard User'}
                    </Badge>
                  </div>
                  <p className="text-sm text-sidebar-muted">
                    {userRole?.role === 'admin' 
                      ? 'You have full administrative access to manage users, content, and settings.'
                      : userRole?.role === 'moderator'
                      ? 'You can moderate content and manage community guidelines.'
                      : 'You have standard user permissions for chatting and posting.'}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-sidebar-foreground">Your Permissions</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-sidebar">
                      <span className="text-sm text-sidebar-foreground">Create posts</span>
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-sidebar">
                      <span className="text-sm text-sidebar-foreground">Send messages</span>
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-sidebar">
                      <span className="text-sm text-sidebar-foreground">Create groups</span>
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-sidebar">
                      <span className="text-sm text-sidebar-foreground">Manage users</span>
                      {userRole?.role === 'admin' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <span className="text-xs text-muted-foreground">Admin only</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-sidebar">
                      <span className="text-sm text-sidebar-foreground">Moderate content</span>
                      {userRole?.role === 'admin' || userRole?.role === 'moderator' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <span className="text-xs text-muted-foreground">Moderator+</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-sidebar">
                      <span className="text-sm text-sidebar-foreground">Manage advertisements</span>
                      {userRole?.role === 'admin' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <span className="text-xs text-muted-foreground">Admin only</span>
                      )}
                    </div>
                  </div>
                </div>

                {(userRole?.role === 'admin' || userRole?.role === 'moderator') && (
                  <Button 
                    className="w-full" 
                    onClick={() => navigate('/admin')}
                  >
                    Go to Admin Panel
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
