import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MetaIcon, GoogleAdsIcon, TikTokIcon } from "@/components/icons/PlatformIcons";
import { Layers } from "lucide-react";

interface PlatformFilterProps {
  value: string;
  onChange: (value: string) => void;
}

const platforms: { value: string; label: string; icon?: React.ReactNode }[] = [
  { value: "all", label: "Todas as plataformas", icon: <Layers className="h-4 w-4" /> },
  { value: "meta", label: "Meta Ads", icon: <MetaIcon className="h-4 w-4" /> },
  { value: "google", label: "Google Ads", icon: <GoogleAdsIcon className="h-4 w-4" /> },
  { value: "tiktok", label: "TikTok Ads", icon: <TikTokIcon className="h-4 w-4" /> },
];

export function PlatformFilter({ value, onChange }: PlatformFilterProps) {
  const selectedPlatform = platforms.find(p => p.value === value);

  return (
    <div className="flex items-center gap-2">
      {selectedPlatform?.icon}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Todas as plataformas" />
        </SelectTrigger>
        <SelectContent>
          {platforms.map((platform) => (
            <SelectItem key={platform.value} value={platform.value}>
              <div className="flex items-center gap-2">
                {platform.icon}
                {platform.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
