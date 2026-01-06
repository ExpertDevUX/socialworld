import { useState } from "react";
import { Mail, Phone, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

type ResetMode = "email" | "phone";
type ResetStep = "input" | "verify" | "success";

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ForgotPasswordDialog = ({ open, onOpenChange }: ForgotPasswordDialogProps) => {
  const [resetMode, setResetMode] = useState<ResetMode>("email");
  const [step, setStep] = useState<ResetStep>("input");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const { resetPasswordForEmail, signInWithOtp, verifyOtp } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleReset = () => {
    setStep("input");
    setEmail("");
    setPhone("");
    setOtp("");
    setLoading(false);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      handleReset();
    }
    onOpenChange(isOpen);
  };

  const handleEmailReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    const { error } = await resetPasswordForEmail(email);
    setLoading(false);

    if (error) {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    } else {
      setStep("success");
      toast({
        title: t("auth.resetPassword.emailSent"),
        description: t("auth.resetPassword.checkEmail"),
      });
    }
  };

  const handlePhoneSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setLoading(true);
    const { error } = await signInWithOtp(phone);
    setLoading(false);

    if (error) {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    } else {
      setStep("verify");
      toast({
        title: t("notifications.verificationCodeSent"),
        description: t("notifications.checkPhone"),
      });
    }
  };

  const handlePhoneVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;

    setLoading(true);
    const { error } = await verifyOtp(phone, otp);
    setLoading(false);

    if (error) {
      toast({
        title: t("notifications.verificationFailed"),
        description: t("notifications.invalidCode"),
        variant: "destructive",
      });
    } else {
      setStep("success");
      toast({
        title: t("common.success"),
        description: t("auth.resetPassword.phoneVerified"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {step === "success" 
              ? t("common.success") 
              : t("auth.resetPassword.title")}
          </DialogTitle>
        </DialogHeader>

        {step === "success" ? (
          <div className="flex flex-col items-center py-6 space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <p className="text-center text-muted-foreground">
              {resetMode === "email" 
                ? t("auth.resetPassword.emailSentDesc") 
                : t("auth.resetPassword.phoneVerifiedDesc")}
            </p>
            <Button onClick={() => handleClose(false)} className="w-full">
              {t("auth.backToLogin")}
            </Button>
          </div>
        ) : (
          <>
            {/* Mode Toggle */}
            {step === "input" && (
              <div className="flex bg-secondary rounded-lg p-1 mb-4">
                <button
                  type="button"
                  onClick={() => setResetMode("email")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    resetMode === "email"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  {t("auth.email")}
                </button>
                <button
                  type="button"
                  onClick={() => setResetMode("phone")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    resetMode === "phone"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  {t("auth.phoneNumber")}
                </button>
              </div>
            )}

            {resetMode === "email" ? (
              <form onSubmit={handleEmailReset} className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  {t("auth.resetPassword.emailDesc")}
                </p>
                <div className="space-y-2">
                  <Label htmlFor="reset-email">{t("auth.email")}</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11"
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading ? t("common.loading") : t("auth.resetPassword.sendLink")}
                </Button>
              </form>
            ) : (
              <>
                {step === "input" ? (
                  <form onSubmit={handlePhoneSendOtp} className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center">
                      {t("auth.resetPassword.phoneDesc")}
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="reset-phone">{t("auth.phoneNumber")}</Label>
                      <Input
                        id="reset-phone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-11"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("settings.includeCountryCode")}
                      </p>
                    </div>
                    <Button type="submit" className="w-full h-11" disabled={loading}>
                      {loading ? t("settings.sending") : t("auth.resetPassword.sendCode")}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handlePhoneVerify} className="space-y-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setStep("input")}
                      className="mb-2"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      {t("common.back")}
                    </Button>
                    <p className="text-sm text-muted-foreground text-center">
                      {t("settings.codeSentTo", { phone })}
                    </p>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={setOtp}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-11" 
                      disabled={loading || otp.length !== 6}
                    >
                      {loading ? t("settings.verifying") : t("settings.verify")}
                    </Button>
                  </form>
                )}
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordDialog;
