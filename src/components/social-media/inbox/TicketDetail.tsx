import { useState } from 'react';
import { X, CheckCircle, ExternalLink, Send, Loader2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATUS_CONFIG, PRIORITY_CONFIG, PLATFORM_ICONS } from './constants';
import type { TicketDetailProps, TicketStatus } from './types';

export function TicketDetail({
  ticket,
  onClose,
  onStatusChange,
  onResolve,
  onSendResponse,
  loading,
}: TicketDetailProps) {
  const [responseText, setResponseText] = useState('');
  const statusConfig = STATUS_CONFIG[ticket.status];
  const priorityConfig = PRIORITY_CONFIG[ticket.priority];
  const PlatformIcon = ticket.customer_platform
    ? PLATFORM_ICONS[ticket.customer_platform] || MessageSquare
    : MessageSquare;

  const handleSend = () => {
    if (responseText.trim()) {
      onSendResponse(responseText);
      setResponseText('');
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden" data-testid="ticket-detail">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={cn('px-2 py-1 rounded-full text-xs font-medium', statusConfig.color)}>
              {statusConfig.label}
            </span>
            <span
              className={cn('px-2 py-1 rounded-full text-xs font-medium', priorityConfig.color)}
            >
              {priorityConfig.label}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            data-testid="btn-close-detail"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            {ticket.mention?.author?.avatar_url ? (
              <img
                src={ticket.mention.author.avatar_url}
                alt=""
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <PlatformIcon className="w-6 h-6 text-gray-500" />
            )}
          </div>
          <div>
            <p className="font-semibold">
              {ticket.mention?.author?.display_name || ticket.customer_username || 'Desconhecido'}
            </p>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <PlatformIcon className="w-4 h-4" />
              @{ticket.mention?.author?.username || ticket.customer_username || '--'}
              {ticket.mention?.author?.followers_count && (
                <span className="ml-2">
                  {ticket.mention.author.followers_count.toLocaleString()} seguidores
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Original Mention */}
      {ticket.mention && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <p className="text-sm text-gray-500 mb-2">Menção Original</p>
          <p className="text-gray-800 dark:text-gray-200">{ticket.mention.content}</p>
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            <span>{new Date(ticket.mention.published_at).toLocaleString('pt-BR')}</span>
            {ticket.mention.url && (
              <a
                href={ticket.mention.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:underline"
              >
                Ver original <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
        <select
          value={ticket.status}
          onChange={(e) => onStatusChange(e.target.value as TicketStatus)}
          className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent text-sm"
          disabled={loading}
          data-testid="select-status-detail"
        >
          <option value="open">Aberto</option>
          <option value="in_progress">Em Progresso</option>
          <option value="pending">Pendente</option>
          <option value="resolved">Resolvido</option>
          <option value="closed">Fechado</option>
        </select>

        {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
          <button
            onClick={onResolve}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm flex items-center gap-2"
            data-testid="btn-resolve"
          >
            <CheckCircle className="w-4 h-4" />
            Resolver
          </button>
        )}
      </div>

      {/* Response Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-sm text-gray-500 mb-4">
          Respostas serão enviadas via plataforma original
        </p>
        {/* Response history would go here */}
      </div>

      {/* Compose Response */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <textarea
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder="Digite sua resposta..."
            rows={3}
            className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="textarea-response"
          />
        </div>
        <div className="flex justify-end mt-2">
          <button
            onClick={handleSend}
            disabled={!responseText.trim() || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            data-testid="btn-send-response"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
