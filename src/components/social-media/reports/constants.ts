import {
  Clock,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  FileText,
  Presentation,
  FileSpreadsheet,
  FileCode,
} from 'lucide-react';
import type { ReportStatus, ReportType, ReportFormat, ScheduleFrequency } from './types';

export const STATUS_CONFIG: Record<
  ReportStatus,
  { label: string; color: string; icon: typeof CheckCircle }
> = {
  pending: { label: 'Pendente', color: 'bg-gray-100 text-gray-700', icon: Clock },
  processing: { label: 'Processando', color: 'bg-blue-100 text-blue-700', icon: Loader2 },
  completed: { label: 'Concluído', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  failed: { label: 'Falhou', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  cancelled: { label: 'Cancelado', color: 'bg-gray-100 text-gray-500', icon: X },
};

export const TYPE_CONFIG: Record<ReportType, { label: string; color: string }> = {
  weekly: { label: 'Semanal', color: 'bg-blue-50 text-blue-700' },
  monthly: { label: 'Mensal', color: 'bg-purple-50 text-purple-700' },
  quarterly: { label: 'Trimestral', color: 'bg-orange-50 text-orange-700' },
  custom: { label: 'Personalizado', color: 'bg-gray-50 text-gray-700' },
  crisis: { label: 'Crise', color: 'bg-red-50 text-red-700' },
  competitive: { label: 'Competitivo', color: 'bg-orange-50 text-orange-700' },
};

export const FORMAT_CONFIG: Record<ReportFormat, { label: string; icon: typeof FileText }> = {
  pdf: { label: 'PDF', icon: FileText },
  pptx: { label: 'PPTX', icon: Presentation },
  xlsx: { label: 'Excel', icon: FileSpreadsheet },
  html: { label: 'HTML', icon: FileCode },
};

export const FREQUENCY_CONFIG: Record<ScheduleFrequency, { label: string }> = {
  daily: { label: 'Diário' },
  weekly: { label: 'Semanal' },
  biweekly: { label: 'Quinzenal' },
  monthly: { label: 'Mensal' },
  quarterly: { label: 'Trimestral' },
};

export const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
