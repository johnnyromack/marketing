import { useState, useCallback } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/layout';
import { Settings, Save, RotateCcw, Loader2, Check, AlertCircle } from 'lucide-react';
import type { SocialMediaSettings } from '@/lib/schemas/social-media-settings.schema';
import { useSocialMediaSettings } from '@/hooks/social-media/useSocialMediaSettings';
import {
  SettingsTabs,
  PreferencesTab,
  PlatformsTab,
  AlertsTab,
  type TabId,
} from '@/components/social-media/settings';

// ============================================
// Main Page Component
// ============================================

export default function SocialMediaSettingsPage() {
  const {
    settings,
    isLoading,
    isSaving,
    saveMessage,
    hasChanges,
    updateSettings,
    saveSettings,
    resetToDefaults,
  } = useSocialMediaSettings();
  const [activeTab, setActiveTab] = useState<TabId>('preferences');

  const handleChange = useCallback(
    (updates: Partial<SocialMediaSettings>) => {
      updateSettings(updates);
    },
    [updateSettings]
  );

  const handleSave = async () => {
    await saveSettings();
  };

  const handleReset = async () => {
    if (
      !confirm('Tem certeza que deseja restaurar todas as configurações para os valores padrao?')
    ) {
      return;
    }
    await resetToDefaults();
  };

  return (
    <AppLayout>
      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="mb-[var(--qi-spacing-lg)] flex flex-col gap-[var(--qi-spacing-md)] md:flex-row md:items-center md:justify-between">
          <PageHeader
            title="Configurações"
            description="Personalize suas preferencias do modulo Social Media"
          />
          <div className="flex items-center gap-[var(--qi-spacing-sm)]">
            <button
              onClick={handleReset}
              disabled={isLoading || isSaving}
              className="flex items-center gap-2 rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] px-[var(--qi-spacing-md)] py-[var(--qi-spacing-sm)] text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)] transition-colors hover:bg-[var(--qi-bg-secondary)] disabled:opacity-50"
              data-testid="btn-reset-settings"
            >
              <RotateCcw className="h-4 w-4" />
              Restaurar Padrao
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || isSaving || !hasChanges}
              className="flex items-center gap-2 rounded-[var(--qi-radius-md)] bg-[var(--qi-accent)] px-[var(--qi-spacing-md)] py-[var(--qi-spacing-sm)] text-[var(--qi-font-size-body-sm)] text-white transition-colors hover:opacity-90 disabled:opacity-50"
              data-testid="btn-save-settings"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar
            </button>
          </div>
        </div>

        {/* Save message */}
        {saveMessage && (
          <div
            data-testid={`settings-message-${saveMessage.type}`}
            className={`mb-[var(--qi-spacing-lg)] flex items-center gap-2 rounded-[var(--qi-radius-md)] px-4 py-3 ${
              saveMessage.type === 'success'
                ? 'bg-semantic-success/10 text-semantic-success'
                : 'bg-semantic-error/10 text-semantic-error'
            }`}
          >
            {saveMessage.type === 'success' ? (
              <Check className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span className="text-[var(--qi-font-size-body-sm)]">{saveMessage.text}</span>
          </div>
        )}

        {/* Loading state */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--qi-accent)]" />
          </div>
        ) : (
          <>
            {/* Tabs */}
            <SettingsTabs activeTab={activeTab} onChangeTab={setActiveTab} />

            {/* Tab content */}
            {activeTab === 'preferences' && (
              <PreferencesTab settings={settings} onChange={handleChange} />
            )}
            {activeTab === 'platforms' && (
              <PlatformsTab settings={settings} onChange={handleChange} />
            )}
            {activeTab === 'alerts' && <AlertsTab settings={settings} onChange={handleChange} />}

            {/* Unsaved changes indicator */}
            {hasChanges && (
              <div
                data-testid="unsaved-changes-indicator"
                className="fixed bottom-4 right-4 rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] px-4 py-2 shadow-lg"
              >
                <span className="text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]">
                  Voce tem alterações não salvas
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
