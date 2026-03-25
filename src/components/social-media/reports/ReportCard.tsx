import { Download, Play, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATUS_CONFIG, TYPE_CONFIG, FORMAT_CONFIG } from './constants';
import type { ReportCardProps } from './types';

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return '--';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ReportCard({ report, onDownload, onGenerate, onDelete }: ReportCardProps) {
  const statusConfig = STATUS_CONFIG[report.status];
  const typeConfig = TYPE_CONFIG[report.type];
  const formatConfig = FORMAT_CONFIG[report.format];
  const StatusIcon = statusConfig.icon;
  const FormatIcon = formatConfig.icon;

  return (
    <div className="bg-white rounded-lg border p-4 hover:shadow-sm transition-shadow" data-testid={`report-card-${report.id}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <div className="flex-shrink-0 p-2 bg-gray-50 rounded-lg">
            <FormatIcon className="h-5 w-5 text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate" data-testid={`report-name-${report.id}`}>{report.name}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={cn('text-xs px-2 py-0.5 rounded-full', typeConfig.color)} data-testid={`report-type-${report.id}`}>
                {typeConfig.label}
              </span>
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full flex items-center',
                  statusConfig.color
                )}
                data-testid={`report-status-${report.id}`}
              >
                <StatusIcon
                  className={cn('h-3 w-3 mr-1', report.status === 'processing' && 'animate-spin')}
                />
                {statusConfig.label}
              </span>
            </div>
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
              <span>{formatConfig.label}</span>
              <span>{formatFileSize(report.file_size)}</span>
              <span>Criado: {formatDate(report.created_at)}</span>
              {report.generated_at && <span>Gerado: {formatDate(report.generated_at)}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          {report.status === 'completed' && report.file_url && (
            <button
              onClick={onDownload}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Download"
              data-testid={`btn-download-${report.id}`}
            >
              <Download className="h-4 w-4" />
            </button>
          )}
          {(report.status === 'pending' || report.status === 'failed') && (
            <button
              onClick={onGenerate}
              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Gerar"
              data-testid={`btn-generate-${report.id}`}
            >
              <Play className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onDelete}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Excluir"
            data-testid={`btn-delete-report-${report.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {report.error && (
        <div className="mt-3 p-2 bg-red-50 rounded text-sm text-red-600">{report.error}</div>
      )}
    </div>
  );
}
