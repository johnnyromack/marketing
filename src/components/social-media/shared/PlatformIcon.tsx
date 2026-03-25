import {
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Youtube,
  MessageSquare,
  Music2,
  type LucideIcon,
} from 'lucide-react';
import type { SocialPlatform } from '@/lib/schemas/social-media.schema';

interface PlatformIconProps {
  platform: SocialPlatform;
  size?: 'sm' | 'md' | 'lg' | number;
  className?: string;
  showLabel?: boolean;
}

const PLATFORM_CONFIG: Record<
  SocialPlatform,
  { icon: LucideIcon; label: string; color: string; bgColor: string }
> = {
  instagram: {
    icon: Instagram,
    label: 'Instagram',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
  },
  facebook: {
    icon: Facebook,
    label: 'Facebook',
    color: 'text-blue-600',
    bgColor: 'bg-blue-600/10',
  },
  linkedin: {
    icon: Linkedin,
    label: 'LinkedIn',
    color: 'text-blue-700',
    bgColor: 'bg-blue-700/10',
  },
  twitter: {
    icon: Twitter,
    label: 'Twitter/X',
    color: 'text-sky-500',
    bgColor: 'bg-sky-500/10',
  },
  youtube: {
    icon: Youtube,
    label: 'YouTube',
    color: 'text-red-600',
    bgColor: 'bg-red-600/10',
  },
  tiktok: {
    icon: Music2,
    label: 'TikTok',
    color: 'text-slate-900 dark:text-slate-100',
    bgColor: 'bg-slate-900/10 dark:bg-slate-100/10',
  },
  google_business: {
    icon: MessageSquare,
    label: 'Google Business',
    color: 'text-green-600',
    bgColor: 'bg-green-600/10',
  },
  reddit: {
    icon: MessageSquare,
    label: 'Reddit',
    color: 'text-orange-600',
    bgColor: 'bg-orange-600/10',
  },
};

const SIZE_MAP = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export function PlatformIcon({
  platform,
  size = 'md',
  className = '',
  showLabel = false,
}: PlatformIconProps) {
  const config = PLATFORM_CONFIG[platform];
  const Icon = config.icon;

  const sizeClass = typeof size === 'number' ? '' : SIZE_MAP[size] || SIZE_MAP['md'];
  const sizeStyle = typeof size === 'number' ? { width: size, height: size } : undefined;

  if (showLabel) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <div className={`p-1 rounded ${config.bgColor}`}>
          <Icon className={`${sizeClass} ${config.color}`} style={sizeStyle} />
        </div>
        <span className="text-sm text-foreground">
          {config.label}
        </span>
      </div>
    );
  }

  return <Icon className={`${sizeClass} ${config.color} ${className}`} style={sizeStyle} />;
}

export function PlatformBadge({
  platform,
  className = '',
}: {
  platform: SocialPlatform;
  className?: string;
}) {
  const config = PLATFORM_CONFIG[platform];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color} ${className}`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

export { PLATFORM_CONFIG };
