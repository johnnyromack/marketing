import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TYPE_CONFIG, FORMAT_CONFIG } from './constants';
import type { CreateReportModalProps, ReportType, ReportFormat } from './types';

export function CreateReportModal({ isOpen, onClose, onCreate }: CreateReportModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<ReportType>('weekly');
  const [format, setFormat] = useState<ReportFormat>('pdf');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      name,
      type,
      format,
      config: {
        sections: ['cover', 'overview', 'sentiment', 'top_posts', 'insights'],
      },
    });
    setName('');
    setType('weekly');
    setFormat('pdf');
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
          <h2 className="font-semibold text-foreground">Novo Relatório</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form id="create-report-form" onSubmit={handleSubmit} data-testid="modal-create-report">
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="nome-94" className={labelClasses}>
                Nome
              </label>
              <input
                id="nome-94"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClasses}
                placeholder="Relatório Semanal - Jan 2024"
                required
                data-testid="input-report-name"
              />
            </div>
            <div>
              <label htmlFor="tipo-106" className={labelClasses}>
                Tipo
              </label>
              <select
                id="tipo-106"
                value={type}
                onChange={(e) => setType(e.target.value as ReportType)}
                className={inputClasses}
                data-testid="select-report-type"
              >
                {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="formato-121" className={labelClasses}>
                Formato
              </label>
              <select
                id="formato-121"
                value={format}
                onChange={(e) => setFormat(e.target.value as ReportFormat)}
                className={inputClasses}
                data-testid="select-report-format"
              >
                {Object.entries(FORMAT_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 p-6 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
              data-testid="btn-cancel"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="create-report-form"
              className="rounded-md px-4 py-2 font-medium text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              data-testid="btn-create"
            >
              Criar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
