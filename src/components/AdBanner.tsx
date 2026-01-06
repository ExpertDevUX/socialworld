import { ExternalLink, X } from "lucide-react";
import { useAdvertisements } from "@/hooks/useAdvertisements";
import { useProfile } from "@/hooks/useProfile";
import { useState } from "react";

interface AdBannerProps {
  placement?: "sidebar" | "banner" | "inline";
  className?: string;
}

const AdBanner = ({ placement = "sidebar", className = "" }: AdBannerProps) => {
  const { data: profile } = useProfile();
  const { data: ads = [] } = useAdvertisements(placement);
  const [dismissedAds, setDismissedAds] = useState<string[]>([]);

  // Don't show ads if user has disabled them
  if (profile?.show_ads === false) {
    return null;
  }

  // Filter out dismissed ads and get the highest priority one
  const visibleAds = ads.filter((ad) => !dismissedAds.includes(ad.id));
  
  if (visibleAds.length === 0) {
    return null;
  }

  const ad = visibleAds[0]; // Show highest priority ad (already sorted by priority)

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDismissedAds((prev) => [...prev, ad.id]);
  };

  const handleClick = () => {
    if (ad.link_url) {
      window.open(ad.link_url, "_blank", "noopener,noreferrer");
    }
  };

  if (placement === "sidebar") {
    return (
      <div className={`p-3 ${className}`}>
        <div 
          className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl overflow-hidden cursor-pointer hover:border-primary/40 transition-colors group"
          onClick={handleClick}
        >
          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 z-10 p-1 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
          >
            <X className="w-3 h-3 text-muted-foreground" />
          </button>

          {ad.image_url && (
            <div className="relative h-24 overflow-hidden">
              <img
                src={ad.image_url}
                alt={ad.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            </div>
          )}

          <div className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-foreground truncate">
                  {ad.title}
                </h4>
                {ad.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {ad.description}
                  </p>
                )}
              </div>
              {ad.link_url && (
                <ExternalLink className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              )}
            </div>
            <span className="inline-block text-[10px] text-muted-foreground mt-2 uppercase tracking-wider">
              Sponsored
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (placement === "banner") {
    return (
      <div className={`relative ${className}`}>
        <div 
          className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-y border-primary/20 cursor-pointer hover:bg-primary/15 transition-colors group"
          onClick={handleClick}
        >
          <button
            onClick={handleDismiss}
            className="absolute top-1/2 -translate-y-1/2 right-3 z-10 p-1 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
          >
            <X className="w-3 h-3 text-muted-foreground" />
          </button>

          <div className="flex items-center gap-4 px-4 py-3">
            {ad.image_url && (
              <img
                src={ad.image_url}
                alt={ad.title}
                className="w-12 h-12 object-cover rounded-lg shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm text-foreground truncate">
                  {ad.title}
                </h4>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider shrink-0">
                  Sponsored
                </span>
              </div>
              {ad.description && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {ad.description}
                </p>
              )}
            </div>
            {ad.link_url && (
              <ExternalLink className="w-4 h-4 text-primary shrink-0" />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Inline placement
  return (
    <div className={`${className}`}>
      <div 
        className="relative bg-muted/50 border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors group p-3"
        onClick={handleClick}
      >
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 z-10 p-1 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
        >
          <X className="w-3 h-3 text-muted-foreground" />
        </button>

        <div className="flex items-start gap-3">
          {ad.image_url && (
            <img
              src={ad.image_url}
              alt={ad.title}
              className="w-16 h-16 object-cover rounded-lg shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider bg-muted px-1.5 py-0.5 rounded">
                Ad
              </span>
            </div>
            <h4 className="font-medium text-sm text-foreground mt-1">
              {ad.title}
            </h4>
            {ad.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {ad.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdBanner;
