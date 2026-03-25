import {
  Rss,
  Globe,
  Newspaper,
  Youtube,
  CheckCircle,
  Pause,
  AlertCircle,
  Clock,
} from 'lucide-react';
import type { SourceType, SourceCategory, SourceStatus, ItemSentiment } from './types';

export const TYPE_CONFIG: Record<SourceType, { label: string; icon: typeof Rss }> = {
  rss: { label: 'RSS', icon: Rss },
  website: { label: 'Website', icon: Globe },
  podcast: { label: 'Podcast', icon: Rss },
  youtube: { label: 'YouTube', icon: Youtube },
  google_news: { label: 'Google News', icon: Newspaper },
};

export const CATEGORY_CONFIG: Record<SourceCategory, { label: string; color: string }> = {
  news: { label: 'Notícias', color: 'bg-blue-50 text-blue-700' },
  blog: { label: 'Blog', color: 'bg-purple-50 text-purple-700' },
  press: { label: 'Imprensa', color: 'bg-green-50 text-green-700' },
  industry: { label: 'Indústria', color: 'bg-orange-50 text-orange-700' },
  government: { label: 'Governo', color: 'bg-gray-50 text-gray-700' },
  social: { label: 'Social', color: 'bg-pink-50 text-pink-700' },
  forum: { label: 'Fórum', color: 'bg-yellow-50 text-yellow-700' },
  review: { label: 'Avaliações', color: 'bg-red-50 text-red-700' },
};

export const STATUS_CONFIG: Record<
  SourceStatus,
  { label: string; color: string; icon: typeof CheckCircle }
> = {
  active: { label: 'Ativo', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  paused: { label: 'Pausado', color: 'bg-gray-100 text-gray-500', icon: Pause },
  error: { label: 'Erro', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  pending_verification: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
};

export const TIER_CONFIG: Record<number, { label: string; color: string }> = {
  1: { label: 'Tier 1', color: 'bg-blue-600 text-white' },
  2: { label: 'Tier 2', color: 'bg-blue-400 text-white' },
  3: { label: 'Tier 3', color: 'bg-gray-400 text-white' },
};

export const SENTIMENT_CONFIG: Record<ItemSentiment, { label: string; color: string }> = {
  positive: { label: 'Positivo', color: 'text-green-600' },
  neutral: { label: 'Neutro', color: 'text-gray-600' },
  negative: { label: 'Negativo', color: 'text-red-600' },
  mixed: { label: 'Misto', color: 'text-yellow-600' },
};
