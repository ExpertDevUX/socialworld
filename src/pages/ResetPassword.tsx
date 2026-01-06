import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { updatePassword, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    // If user is not in password recovery mode, redirect
    // The user object should exist when coming from reset password email
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: t("common.error"),
        description: t("auth.resetPassword.passwordMismatch"),
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: t("common.error"),
        description: t("auth.resetPassword.passwordTooShort"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(newPassword);
    setLoading(false);

    if (error) {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    } else {
      setSuccess(true);
      toast({
        title: t("common.success"),
        description: t("auth.resetPassword.passwordUpdated"),
      });
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Header />
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardContent className="pt-8 pb-6 px-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-center text-foreground">
                {t("auth.resetPassword.passwordUpdated")}
              </h1>
              <p className="text-center text-muted-foreground">
                {t("auth.resetPassword.canNowLogin")}
              </p>
              <Button onClick={() => navigate("/")} className="w-full h-11">
                {t("auth.backToLogin")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Header />
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardContent className="pt-8 pb-6 px-8">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center">
              <MessageSquare className="w-7 h-7 text-primary-foreground" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center text-foreground mb-1">
            {t("auth.resetPassword.newPassword")}
          </h1>
          <p className="text-muted-foreground text-center mb-6">
            {t("auth.resetPassword.enterNewPassword")}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t("settings.newPassword")}</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-11 pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("settings.confirmNewPassword")}</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11"
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? t("common.loading") : t("auth.resetPassword.updatePassword")}
            </Button>
          </form>

          <p className="text-center mt-6 text-sm text-muted-foreground">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              {t("auth.backToLogin")}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
