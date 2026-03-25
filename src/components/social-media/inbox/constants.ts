import React from 'react';
import {
  Inbox,
  Clock,
  AlertCircle,
  CheckCircle,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Building2,
} from 'lucide-react';
import type { TicketStatus, TicketPriority } from './types';

export const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  open: { label: 'Aberto', color: 'bg-blue-100 text-blue-700', icon: Inbox },
  in_progress: { label: 'Em Progresso', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  pending: { label: 'Pendente', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
  resolved: { label: 'Resolvido', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  closed: { label: 'Fechado', color: 'bg-gray-100 text-gray-700', icon: CheckCircle },
};

export const PRIORITY_CONFIG: Record<TicketPriority, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'bg-gray-100 text-gray-600' },
  medium: { label: 'Média', color: 'bg-blue-100 text-blue-600' },
  high: { label: 'Alta', color: 'bg-orange-100 text-orange-600' },
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-600' },
};

export const PLATFORM_ICONS: Record<string, React.ElementType> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  twitter: Twitter,
  google_business: Building2,
};
