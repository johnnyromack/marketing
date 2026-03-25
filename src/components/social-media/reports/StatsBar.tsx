import { useMemo } from 'react';
import { FileText, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import type { StatsBarProps } from './types';

export function StatsBar({ reports }: StatsBarProps) {
  const stats = useMemo(() => {
    const completed = reports.filter((r) => r.status === 'completed').length;
    const processing = reports.filter((r) => r.status === 'processing').length;
    const failed = reports.filter((r) => r.status === 'failed').length;
    const pending = reports.filter((r) => r.status === 'pending').length;

    return { completed, processing, failed, pending, total: reports.length };
  }, [reports]);

  return (
    <div className="grid grid-cols-4 gap-4 mb-6" data-testid="stats-bar">
      <div className="bg-white rounded-lg border p-4" data-testid="stat-total">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-semibold">{stats.total}</p>
          </div>
          <FileText className="h-8 w-8 text-gray-400" />
        </div>
      </div>
      <div className="bg-white rounded-lg border p-4" data-testid="stat-completed">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Concluídos</p>
            <p className="text-2xl font-semibold text-green-600">{stats.completed}</p>
          </div>
          <CheckCircle className="h-8 w-8 text-green-400" />
        </div>
      </div>
      <div className="bg-white rounded-lg border p-4" data-testid="stat-processing">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Processando</p>
            <p className="text-2xl font-semibold text-blue-600">{stats.processing}</p>
          </div>
          <Loader2 className="h-8 w-8 text-blue-400" />
        </div>
      </div>
      <div className="bg-white rounded-lg border p-4" data-testid="stat-failed">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Falhas</p>
            <p className="text-2xl font-semibold text-red-600">{stats.failed}</p>
          </div>
          <AlertCircle className="h-8 w-8 text-red-400" />
        </div>
      </div>
    </div>
  );
}
