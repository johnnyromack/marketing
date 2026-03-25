import { cn } from "@/lib/utils";
import metaLogo from "@/assets/logos/meta-logo.png";
import googleAdsLogo from "@/assets/logos/google-ads-logo.webp";
import tiktokLogo from "@/assets/logos/tiktok-logo.png";

interface IconProps {
  className?: string;
  size?: number;
}

export function MetaIcon({ className, size = 24 }: IconProps) {
  return (
    <img src={metaLogo} alt="Meta Ads" width={size} height={size} className={cn("object-contain", className)} />
  );
}

export function GoogleAdsIcon({ className, size = 24 }: IconProps) {
  return (
    <img src={googleAdsLogo} alt="Google Ads" width={size} height={size} className={cn("object-contain", className)} />
  );
}

export function TikTokIcon({ className, size = 24 }: IconProps) {
  return (
    <img src={tiktokLogo} alt="TikTok Ads" width={size} height={size} className={cn("object-contain", className)} />
  );
}

export function PlatformLogo({ platform, size = 20, showBackground = true }: { platform: "meta" | "google" | "tiktok"; size?: number; showBackground?: boolean }) {
  const bgClasses = {
    meta: "bg-blue-50 dark:bg-blue-950/30",
    google: "bg-amber-50 dark:bg-amber-950/30",
    tiktok: "bg-slate-50 dark:bg-slate-800/30",
  };

  const icons = {
    meta: <MetaIcon size={size} />,
    google: <GoogleAdsIcon size={size} />,
    tiktok: <TikTokIcon size={size} />,
  };

  if (!showBackground) {
    return icons[platform];
  }

  return (
    <div className={cn("flex items-center justify-center rounded-lg p-1.5", bgClasses[platform])}>
      {icons[platform]}
    </div>
  );
}
