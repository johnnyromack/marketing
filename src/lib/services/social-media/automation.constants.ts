// Triggers available for social-media automations
export const SOCIAL_TRIGGERS: Record<string, string> = {
  // Menções
  'mention.new':      'Nova menção recebida',
  'mention.negative': 'Menção negativa detectada',
  'mention.positive': 'Menção positiva detectada',
  'mention.neutral':  'Menção neutra detectada',

  // Volume / Sentimento
  'volume.spike':          'Pico de volume de menções',
  'volume.drop':           'Queda de volume de menções',
  'sentiment.drop':        'Queda de sentimento positivo',
  'sentiment.crisis':      'Crise de sentimento detectada',

  // Tickets
  'ticket.created':  'Novo ticket criado',
  'ticket.overdue':  'Ticket em atraso',
  'ticket.resolved': 'Ticket resolvido',

  // Publicação
  'post.scheduled':  'Post agendado',
  'post.published':  'Post publicado',
  'post.failed':     'Falha na publicação',
};

// Actions available for social-media automations
export const SOCIAL_ACTIONS: Record<string, string> = {
  // Notificações
  'notify.email':   'Enviar e-mail',
  'notify.slack':   'Enviar no Slack',
  'notify.webhook': 'Disparar webhook',

  // Tickets
  'ticket.create': 'Criar ticket',
  'ticket.assign': 'Atribuir ticket',
  'ticket.close':  'Fechar ticket',

  // Alertas / Incidentes
  'alert.send':        'Enviar alerta',
  'incident.open':     'Abrir incidente',
  'incident.escalate': 'Escalar incidente',

  // HubSpot
  'hubspot.contact': 'Criar contato no HubSpot',
  'hubspot.deal':    'Criar deal no HubSpot',

  // Posts
  'post.boost':  'Impulsionar post',
  'post.remove': 'Remover post',
};
