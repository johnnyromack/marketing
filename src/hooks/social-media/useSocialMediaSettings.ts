/**
 * Social Media Settings Hook
 *
 * Provides data fetching and mutations for social media settings.
 * Queries Supabase directly on social_media_settings table.
 * Table columns: id, user_id, preferences, platform_settings, alert_settings
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ============================================
// Types — inline since @/lib/schemas/social-media-settings.schema may not exist yet
// ============================================

export interface SocialMediaSettings {
  preferences?: {
    language?: string;
    timezone?: string;
    date_format?: string;
    notifications_enabled?: boolean;
    digest_frequency?: 'realtime' | 'daily' | 'weekly';
    [key: string]: unknown;
  };
  platform_settings?: {
    instagram?: Record<string, unknown>;
    twitter?: Record<string, unknown>;
    linkedin?: Record<string, unknown>;
    tiktok?: Record<string, unknown>;
    youtube?: Record<string, unknown>;
    facebook?: Record<string, unknown>;
    [key: string]: Record<string, unknown> | undefined;
  };
  alert_settings?: {
    sentiment_threshold?: number;
    volume_spike_threshold?: number;
    crisis_keywords?: string[];
    notify_email?: boolean;
    notify_in_app?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export const defaultSocialMediaSettings: SocialMediaSettings = {
  preferences: {
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    date_format: 'DD/MM/YYYY',
    notifications_enabled: true,
    digest_frequency: 'daily',
  },
  platform_settings: {},
  alert_settings: {
    sentiment_threshold: -0.5,
    volume_spike_threshold: 200,
    crisis_keywords: [],
    notify_email: true,
    notify_in_app: true,
  },
};

export interface UseSocialMediaSettingsOptions {
  autoFetch?: boolean;
}

export interface UseSocialMediaSettingsReturn {
  settings: SocialMediaSettings;
  originalSettings: SocialMediaSettings;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  saveMessage: { type: 'success' | 'error'; text: string } | null;
  hasChanges: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (updates: Partial<SocialMediaSettings>) => void;
  saveSettings: () => Promise<boolean>;
  resetToDefaults: () => Promise<boolean>;
  clearMessage: () => void;
}

// ============================================
// Hook
// ============================================

export function useSocialMediaSettings(
  options: UseSocialMediaSettingsOptions = {}
): UseSocialMediaSettingsReturn {
  const { autoFetch = true } = options;

  const [settings, setSettings] = useState<SocialMediaSettings>(defaultSocialMediaSettings);
  const [originalSettings, setOriginalSettings] = useState<SocialMediaSettings>(
    defaultSocialMediaSettings
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error: queryError } = await supabase
        .from('social_media_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (queryError && queryError.code !== 'PGRST116') {
        // PGRST116 = row not found — use defaults
        throw new Error(queryError.message);
      }

      if (data) {
        const merged: SocialMediaSettings = {
          preferences: {
            ...defaultSocialMediaSettings.preferences,
            ...(data.preferences as SocialMediaSettings['preferences'] ?? {}),
          },
          platform_settings: {
            ...defaultSocialMediaSettings.platform_settings,
            ...(data.platform_settings as SocialMediaSettings['platform_settings'] ?? {}),
          },
          alert_settings: {
            ...defaultSocialMediaSettings.alert_settings,
            ...(data.alert_settings as SocialMediaSettings['alert_settings'] ?? {}),
          },
        };
        setSettings(merged);
        setOriginalSettings(merged);
      } else {
        // No settings row yet — use defaults
        setSettings(defaultSocialMediaSettings);
        setOriginalSettings(defaultSocialMediaSettings);
      }
    } catch (err) {
      console.error('Failed to load social media settings:', err);
      setError('Erro de conexão ao carregar configurações');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSettings = useCallback((updates: Partial<SocialMediaSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
    setSaveMessage(null);
  }, []);

  const saveSettings = useCallback(async (): Promise<boolean> => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSaveMessage({ type: 'error', text: 'Usuário não autenticado' });
        return false;
      }

      const payload = {
        user_id: user.id,
        preferences: settings.preferences ?? {},
        platform_settings: settings.platform_settings ?? {},
        alert_settings: settings.alert_settings ?? {},
        updated_at: new Date().toISOString(),
      };

      const { data, error: upsertError } = await supabase
        .from('social_media_settings')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .single();

      if (upsertError) throw new Error(upsertError.message);

      if (data) {
        const merged: SocialMediaSettings = {
          preferences: {
            ...defaultSocialMediaSettings.preferences,
            ...(data.preferences as SocialMediaSettings['preferences'] ?? {}),
          },
          platform_settings: {
            ...defaultSocialMediaSettings.platform_settings,
            ...(data.platform_settings as SocialMediaSettings['platform_settings'] ?? {}),
          },
          alert_settings: {
            ...defaultSocialMediaSettings.alert_settings,
            ...(data.alert_settings as SocialMediaSettings['alert_settings'] ?? {}),
          },
        };
        setOriginalSettings(merged);
        setSettings(merged);
      }

      setSaveMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
      return true;
    } catch (_err) {
      setSaveMessage({ type: 'error', text: 'Erro ao salvar configurações' });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [settings]);

  const resetToDefaults = useCallback(async (): Promise<boolean> => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSaveMessage({ type: 'error', text: 'Usuário não autenticado' });
        return false;
      }

      const payload = {
        user_id: user.id,
        preferences: defaultSocialMediaSettings.preferences ?? {},
        platform_settings: defaultSocialMediaSettings.platform_settings ?? {},
        alert_settings: defaultSocialMediaSettings.alert_settings ?? {},
        updated_at: new Date().toISOString(),
      };

      const { error: upsertError } = await supabase
        .from('social_media_settings')
        .upsert(payload, { onConflict: 'user_id' });

      if (upsertError) throw new Error(upsertError.message);

      setSettings(defaultSocialMediaSettings);
      setOriginalSettings(defaultSocialMediaSettings);
      setSaveMessage({
        type: 'success',
        text: 'Configurações restauradas para os valores padrão!',
      });
      return true;
    } catch (_err) {
      setSaveMessage({ type: 'error', text: 'Erro ao restaurar configurações' });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const clearMessage = useCallback(() => {
    setSaveMessage(null);
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchSettings();
    }
  }, [autoFetch, fetchSettings]);

  return {
    settings,
    originalSettings,
    isLoading,
    isSaving,
    error,
    saveMessage,
    hasChanges,
    fetchSettings,
    updateSettings,
    saveSettings,
    resetToDefaults,
    clearMessage,
  };
}

export default useSocialMediaSettings;
