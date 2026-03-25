import {
  Zap,
  Bell,
  Mail,
  MessageSquare,
  Ticket,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import type { TriggerType, ActionType } from './types';

export function TriggerIcon({ trigger }: { trigger: TriggerType }) {
  const t = String(trigger);
  if (t.startsWith('mention.')) {
    return <MessageSquare className="w-5 h-5" />;
  }
  if (t.startsWith('ticket.')) {
    return <Ticket className="w-5 h-5" />;
  }
  if (t.startsWith('volume.') || t.startsWith('sentiment.')) {
    return <TrendingUp className="w-5 h-5" />;
  }
  if (t.startsWith('post.')) {
    return <Bell className="w-5 h-5" />;
  }
  return <Zap className="w-5 h-5" />;
}

export function ActionIcon({ action }: { action: ActionType }) {
  const a = String(action);
  if (a.startsWith('notify.slack')) {
    return <MessageSquare className="w-4 h-4" />;
  }
  if (a.startsWith('notify.email')) {
    return <Mail className="w-4 h-4" />;
  }
  if (a.startsWith('ticket.')) {
    return <Ticket className="w-4 h-4" />;
  }
  if (a.startsWith('alert.') || a.startsWith('incident.')) {
    return <AlertTriangle className="w-4 h-4" />;
  }
  return <Zap className="w-4 h-4" />;
}
