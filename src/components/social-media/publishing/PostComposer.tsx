import { useState, useCallback, useMemo } from 'react';
import { X, Image as ImageIcon, Video, Calendar, Send, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlatformSelector } from './PlatformSelector';
import { PLATFORM_CONFIG } from '../shared/PlatformIcon';
import type {
  SocialPlatform,
  CreatePostInput,
  ScheduledPost,
} from '@/lib/schemas/social-media.schema';

interface PostComposerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (post: CreatePostInput) => Promise<void>;
  initialPost?: Partial<ScheduledPost>;
  initialDate?: Date;
  /** Brand ID for the post */
  brandId: string;
  className?: string;
}

const CHARACTER_LIMITS: Record<SocialPlatform, number> = {
  twitter: 280,
  instagram: 2200,
  facebook: 63206,
  linkedin: 3000,
  tiktok: 2200,
  youtube: 5000,
  google_business: 1500,
  reddit: 40000,
};

export function PostComposer({
  isOpen,
  onClose,
  onSave,
  initialPost,
  initialDate,
  brandId,
}: PostComposerProps) {
  const [content, setContent] = useState(initialPost?.content?.text || '');
  const [platforms, setPlatforms] = useState<SocialPlatform[]>(initialPost?.platforms || []);
  const [scheduledAt, setScheduledAt] = useState<string>(
    initialPost?.scheduled_for || (initialDate ? initialDate.toISOString().slice(0, 16) : '')
  );
  const [requiresApproval, setRequiresApproval] = useState(initialPost?.approval?.required || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate character count and limit warnings
  const characterWarnings = useMemo(() => {
    const warnings: { platform: SocialPlatform; limit: number; current: number }[] = [];
    platforms.forEach((platform) => {
      const limit = CHARACTER_LIMITS[platform];
      if (content.length > limit) {
        warnings.push({ platform, limit, current: content.length });
      }
    });
    return warnings;
  }, [content, platforms]);

  // Get the most restrictive character limit
  const mostRestrictiveLimit = useMemo(() => {
    if (platforms.length === 0) return null;
    return Math.min(...platforms.map((p) => CHARACTER_LIMITS[p]));
  }, [platforms]);

  const handleSubmit = useCallback(
    async (status: 'draft' | 'pending_approval' | 'scheduled') => {
      if (!content.trim()) {
        setError('O conteúdo e obrigatório');
        return;
      }
      if (platforms.length === 0) {
        setError('Selecione pelo menos uma plataforma');
        return;
      }
      if (characterWarnings.length > 0) {
        setError(
          `Conteúdo excede o limite para: ${characterWarnings
            .map((w) => PLATFORM_CONFIG[w.platform].label)
            .join(', ')}`
        );
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const postData: CreatePostInput = {
          platforms,
          content: {
            text: content,
          },
          scheduled_for: scheduledAt || undefined,
          require_approval: requiresApproval,
        };

        await onSave(postData);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar post');
      } finally {
        setIsSubmitting(false);
      }
    },
    [content, platforms, scheduledAt, requiresApproval, brandId, characterWarnings, onSave, onClose]
  );

  const handleSaveDraft = useCallback(() => {
    handleSubmit('draft');
  }, [handleSubmit]);

  const handleSchedule = useCallback(() => {
    if (requiresApproval) {
      handleSubmit('pending_approval');
    } else if (scheduledAt) {
      handleSubmit('scheduled');
    } else {
      setError('Selecione uma data para agendar');
    }
  }, [handleSubmit, requiresApproval, scheduledAt]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        data-testid="post-composer"
        className="relative z-10 w-full max-w-2xl mx-4 bg-card border border-border rounded-xl shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          {/* Header */}
          <div
            data-testid="composer-header"
            className="mb-6 flex items-center justify-between"
          >
            <h2
              data-testid="composer-title"
              className="font-semibold text-lg text-foreground"
            >
              {initialPost?.id ? 'Editar Post' : 'Novo Post'}
            </h2>
            <button
              data-testid="btn-close-composer"
              onClick={onClose}
              className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Fechar editor de post"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div
              data-testid="composer-error"
              className="bg-red-600/10 mb-4 flex items-center gap-2 rounded-md p-3 text-red-600"
            >
              <AlertCircle className="h-5 w-5 flex-shrink-0" data-testid="error-icon" />
              <span data-testid="error-message" className="text-sm">
                {error}
              </span>
            </div>
          )}

          {/* Platform selector */}
          <PlatformSelector
            selected={platforms}
            onChange={setPlatforms}
            className="mb-4"
          />

          {/* Content textarea */}
          <div data-testid="content-section" className="mb-4">
            <label
              htmlFor="postcompos-lbl-1"
              data-testid="content-label"
              className="mb-1 block font-medium text-sm text-foreground"
            >
              Conteúdo
            </label>
            <textarea
              id="postcompos-lbl-1"
              data-testid="content-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva o conteúdo do seu post..."
              rows={6}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            />
            <div data-testid="content-toolbar" className="mt-1 flex items-center justify-between">
              <div data-testid="media-buttons" className="flex gap-2">
                <button
                  type="button"
                  data-testid="btn-add-image"
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  title="Adicionar imagem"
                >
                  <ImageIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  data-testid="btn-add-video"
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  title="Adicionar video"
                >
                  <Video className="h-4 w-4" />
                </button>
              </div>
              <span
                data-testid="character-count"
                className={`text-xs ${
                  mostRestrictiveLimit && content.length > mostRestrictiveLimit
                    ? 'text-red-600'
                    : 'text-muted-foreground'
                }`}
              >
                {content.length}
                {mostRestrictiveLimit && ` / ${mostRestrictiveLimit}`}
              </span>
            </div>

            {/* Character warnings */}
            {characterWarnings.length > 0 && (
              <div data-testid="character-warnings" className="mt-2 space-y-1">
                {characterWarnings.map((warning) => (
                  <p
                    key={warning.platform}
                    data-testid={`warning-${warning.platform}`}
                    className="text-xs text-yellow-600"
                  >
                    {PLATFORM_CONFIG[warning.platform].label}: {warning.current}/{warning.limit}{' '}
                    caracteres
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Schedule */}
          <div data-testid="schedule-section" className="mb-4">
            <label
              htmlFor="postcompos-lbl-2"
              data-testid="schedule-label"
              className="mb-1 block font-medium text-sm text-foreground"
            >
              Agendar para
            </label>
            <div className="flex items-center gap-2">
              <Calendar
                className="h-5 w-5 text-muted-foreground"
                data-testid="schedule-icon"
              />
              <input
                id="postcompos-lbl-2"
                type="datetime-local"
                data-testid="schedule-input"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Approval toggle */}
          <div data-testid="approval-section" className="mb-6">
            <label data-testid="approval-label" className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                data-testid="approval-checkbox"
                checked={requiresApproval}
                onChange={(e) => setRequiresApproval(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
              />
              <span className="text-sm text-foreground">
                Requer aprovação antes de publicar
              </span>
            </label>
          </div>

          {/* Actions */}
          <div
            data-testid="composer-actions"
            className="flex items-center justify-end gap-2 border-t border-border pt-4"
          >
            <Button
              data-testid="btn-cancel"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              data-testid="btn-save-draft"
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
            >
              <Save className="mr-2 h-4 w-4" />
              Salvar Rascunho
            </Button>
            <Button
              data-testid="btn-schedule"
              onClick={handleSchedule}
              disabled={isSubmitting || platforms.length === 0}
            >
              <Send className="mr-2 h-4 w-4" />
              {scheduledAt ? 'Agendar' : 'Publicar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
