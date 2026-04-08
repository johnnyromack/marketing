import {
  Instagram,
  Facebook,
  Linkedin,
  MessageSquare,
  Zap,
  Search,
  AlertTriangle,
  Calendar,
  BarChart3,
} from 'lucide-react';

export const PLATFORM_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  google_business: MessageSquare,
  tiktok: Zap,
  twitter: MessageSquare,
  youtube: MessageSquare,
  reddit: MessageSquare,
};

export const QUICK_ACTIONS = [
  {
    label: 'Listening',
    description: 'Ver mencoes recentes',
    icon: MessageSquare,
    href: '/social/listening',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    label: 'Queries',
    description: 'Gerenciar buscas',
    icon: Search,
    href: '/social/queries',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    label: 'Crisis Center',
    description: 'Monitorar alertas',
    icon: AlertTriangle,
    href: '/social/crisis',
    color: 'text-red-600',
    bgColor: 'bg-red-600/10',
  },
  {
    label: 'Publishing',
    description: 'Agendar posts',
    icon: Calendar,
    href: '/social/publishing',
    color: 'text-green-600',
    bgColor: 'bg-green-600/10',
  },
  {
    label: 'Analytics',
    description: 'Ver relatorios',
    icon: BarChart3,
    href: '/social/analytics',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-600/10',
  },
];

export const ALL_PLATFORMS = [
  { name: 'Instagram', platform: 'instagram', icon: Instagram },
  { name: 'Facebook', platform: 'facebook', icon: Facebook },
  { name: 'LinkedIn', platform: 'linkedin', icon: Linkedin },
  { name: 'Google Business', platform: 'google_business', icon: MessageSquare },
  { name: 'TikTok', platform: 'tiktok', icon: Zap },
];

export const SEVERITY_COLORS: Record<string, string> = {
  P1: 'bg-red-600 text-white',
  P2: 'bg-yellow-500 text-white',
  P3: 'bg-blue-500 text-white',
  P4: 'bg-muted text-muted-foreground',
};
