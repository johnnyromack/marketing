import { Calendar, Clock, Play, Pause, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FREQUENCY_CONFIG, DAY_NAMES } from './constants';
import type { ScheduleCardProps } from './types';

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ScheduleCard({ schedule, onToggle, onDelete }: ScheduleCardProps) {
  const frequencyConfig = FREQUENCY_CONFIG[schedule.frequency];

  const getScheduleDescription = (): string => {
    let desc = frequencyConfig.label;
    if (schedule.frequency === 'weekly' && schedule.day_of_week != null) {
      desc += ` (${DAY_NAMES[schedule.day_of_week]})`;
    }
    if (schedule.frequency === 'monthly' && schedule.day_of_month) {
      desc += ` (dia ${schedule.day_of_month})`;
    }
    desc += ` às ${schedule.time_of_day}`;
    return desc;
  };

  return (
    <div className="bg-white rounded-lg border p-4 hover:shadow-sm transition-shadow" data-testid={`schedule-card-${schedule.id}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium text-gray-900 truncate" data-testid={`schedule-name-${schedule.id}`}>{schedule.name}</h3>
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                schedule.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              )}
              data-testid={`schedule-status-${schedule.id}`}
            >
              {schedule.is_active ? 'Ativo' : 'Pausado'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{getScheduleDescription()}</p>
          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              Última: {formatDate(schedule.last_run_at)}
            </span>
            <span className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              Próxima: {formatDate(schedule.next_run_at)}
            </span>
            {schedule.recipients.length > 0 && (
              <span>{schedule.recipients.length} destinatário(s)</span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={onToggle}
            className={cn(
              'p-2 rounded-lg transition-colors',
              schedule.is_active
                ? 'text-yellow-600 hover:bg-yellow-50'
                : 'text-green-600 hover:bg-green-50'
            )}
            title={schedule.is_active ? 'Pausar' : 'Ativar'}
            data-testid={`btn-toggle-${schedule.id}`}
          >
            {schedule.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Excluir"
            data-testid={`btn-delete-schedule-${schedule.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {schedule.last_error && (
        <div className="mt-3 p-2 bg-red-50 rounded text-sm text-red-600">
          Último erro: {schedule.last_error}
        </div>
      )}
    </div>
  );
}
