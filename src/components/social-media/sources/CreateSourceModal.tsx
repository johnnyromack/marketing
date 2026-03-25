import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TYPE_CONFIG, CATEGORY_CONFIG } from './constants';
import type { CreateSourceModalProps, SourceType, SourceCategory } from './types';

export function CreateSourceModal({ isOpen, onClose, onCreate }: CreateSourceModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<SourceType>('rss');
  const [url, setUrl] = useState('');
  const [feedUrl, setFeedUrl] = useState('');
  const [category, setCategory] = useState<SourceCategory | ''>('');
  const [tier, setTier] = useState<number>(3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      name,
      type,
      url,
      feed_url: feedUrl || undefined,
      category: category || undefined,
      tier,
    });
    setName('');
    setType('rss');
    setUrl('');
    setFeedUrl('');
    setCategory('');
    setTier(3);
    onClose();
  };

  const inputClasses = cn(
    'w-full px-3 py-2',
    'bg-muted',
    'border border-border',
    'rounded-md',
    'text-sm text-foreground',
    'focus:outline-none focus:ring-2 focus:ring-ring',
    'transition-colors'
  );

  const labelClasses = cn(
    'block mb-1',
    'text-sm font-medium',
    'text-foreground'
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-card border border-border rounded-xl shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-semibold text-foreground">Adicionar Fonte</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form id="create-source-form" onSubmit={handleSubmit} data-testid="modal-create-source">
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="nome-100" className={labelClasses}>
                Nome
              </label>
              <input
                id="nome-100"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClasses}
                placeholder="Folha de São Paulo"
                required
                data-testid="input-source-name"
              />
            </div>
            <div>
              <label htmlFor="tipo-112" className={labelClasses}>
                Tipo
              </label>
              <select
                id="tipo-112"
                value={type}
                onChange={(e) => setType(e.target.value as SourceType)}
                className={inputClasses}
                data-testid="select-source-type"
              >
                {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="url-do-site-127" className={labelClasses}>
                URL do Site
              </label>
              <input
                id="url-do-site-127"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className={inputClasses}
                placeholder="https://www.folha.uol.com.br"
                required
                data-testid="input-source-url"
              />
            </div>
            <div>
              <label htmlFor="url-do-feed-rss-opcional-139" className={labelClasses}>
                URL do Feed RSS (opcional)
              </label>
              <input
                id="url-do-feed-rss-opcional-139"
                type="url"
                value={feedUrl}
                onChange={(e) => setFeedUrl(e.target.value)}
                className={inputClasses}
                placeholder="https://www.folha.uol.com.br/rss/..."
                data-testid="input-source-feed-url"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="categoria-151" className={labelClasses}>
                  Categoria
                </label>
                <select
                  id="categoria-151"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as SourceCategory | '')}
                  className={inputClasses}
                  data-testid="select-source-category"
                >
                  <option value="">Selecionar...</option>
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="tier-167" className={labelClasses}>
                  Tier
                </label>
                <select
                  id="tier-167"
                  value={tier}
                  onChange={(e) => setTier(Number(e.target.value))}
                  className={inputClasses}
                  data-testid="select-source-tier"
                >
                  <option value={1}>Tier 1 (Principal)</option>
                  <option value={2}>Tier 2 (Médio)</option>
                  <option value={3}>Tier 3 (Nicho)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 p-6 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
              data-testid="btn-cancel-source"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="create-source-form"
              className="rounded-md px-4 py-2 font-medium text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              data-testid="btn-create-source"
            >
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
