import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthCard from "@/components/AuthCard";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, Shield, Zap, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!loading && user) {
      navigate("/chat");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const features = [
    {
      icon: MessageSquare,
      title: t("auth.features.realtime.title"),
      description: t("auth.features.realtime.description"),
    },
    {
      icon: Shield,
      title: t("auth.features.secure.title"),
      description: t("auth.features.secure.description"),
    },
    {
      icon: Zap,
      title: t("auth.features.fast.title"),
      description: t("auth.features.fast.description"),
    },
    {
      icon: Globe,
      title: t("auth.features.global.title"),
      description: t("auth.features.global.description"),
    },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      <Header />
      
      {/* Left Column - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-primary-foreground">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-primary-foreground/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <MessageSquare className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold">ChatFlow</span>
          </div>
          
          <h1 className="text-4xl xl:text-5xl font-bold mb-4 leading-tight">
            {t("auth.hero.title")}
          </h1>
          <p className="text-lg xl:text-xl text-primary-foreground/80 mb-12 max-w-md">
            {t("auth.hero.subtitle")}
          </p>

          <div className="grid grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary-foreground/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-primary-foreground/70">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-primary-foreground/5 rounded-full blur-3xl" />
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-primary-foreground/5 rounded-full blur-3xl" />
      </div>

      {/* Right Column - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <AuthCard />
      </div>
    </div>
  );
};

export default Index;
