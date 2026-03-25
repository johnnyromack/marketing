import type { SocialMediaSettings } from '@/lib/schemas/social-media-settings.schema';

export type TabId = 'preferences' | 'platforms' | 'alerts';

export interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

export interface SettingsTabProps {
  settings: SocialMediaSettings;
  onChange: (updates: Partial<SocialMediaSettings>) => void;
}
