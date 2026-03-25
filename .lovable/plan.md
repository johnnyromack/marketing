
# Plano de Integração: Meta Ads e Google Ads no Dashboard de Mídia On

## Visão Geral

Este plano detalha a integração das plataformas **Meta Ads (Facebook/Instagram)** e **Google Ads** com o Dashboard de Mídia On, permitindo a sincronização automática de campanhas ativas e seus respectivos anúncios.

---

## Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React)                               │
│  ┌──────────────────┐   ┌──────────────────┐   ┌────────────────────┐   │
│  │ Página de Config │   │ Dashboard Mídia  │   │ Sincronização      │   │
│  │ (Conectar Contas)│   │ On (Campanhas)   │   │ Manual/Automática  │   │
│  └────────┬─────────┘   └────────┬─────────┘   └──────────┬─────────┘   │
└───────────│─────────────────────│─────────────────────────│─────────────┘
            │                      │                         │
            ▼                      ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       EDGE FUNCTIONS (Backend)                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │ meta-ads-sync   │  │ google-ads-sync │  │ ads-integration-webhook │  │
│  │ (OAuth + API)   │  │ (OAuth + API)   │  │ (Sincronização agendada)│  │
│  └────────┬────────┘  └────────┬────────┘  └───────────┬─────────────┘  │
└───────────│────────────────────│───────────────────────│────────────────┘
            │                     │                       │
            ▼                     ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          SUPABASE (Database)                             │
│  ┌───────────────────┐  ┌────────────────────┐  ┌────────────────────┐  │
│  │ ads_integrations  │  │ ads_campaigns      │  │ ads_creatives      │  │
│  │ (Credenciais)     │  │ (Campanhas sync)   │  │ (Anúncios)         │  │
│  └───────────────────┘  └────────────────────┘  └────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
            │                     │
            ▼                     ▼
   ┌─────────────────┐   ┌─────────────────┐
   │  Meta Ads API   │   │ Google Ads API  │
   │  (Marketing API)│   │ (REST API)      │
   └─────────────────┘   └─────────────────┘
```

---

## Etapa 1: Configuração de APIs Externas (Manual)

### Meta Ads (Facebook Business)
Você precisará criar um aplicativo no **Meta for Developers**:

1. Acesse [developers.facebook.com](https://developers.facebook.com)
2. Crie um novo App do tipo "Business"
3. Adicione os produtos: **Marketing API** e **Facebook Login**
4. Configure as permissões: `ads_read`, `ads_management`, `business_management`
5. Obtenha:
   - **App ID**
   - **App Secret**
   - Configure o **Redirect URI**: `https://nzmherisqehvzhmsxmeb.supabase.co/functions/v1/meta-ads-callback`

### Google Ads
Você precisará configurar no **Google Cloud Console**:

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie ou selecione um projeto
3. Ative a **Google Ads API**
4. Configure a tela de consentimento OAuth
5. Crie credenciais OAuth 2.0:
   - **Client ID**
   - **Client Secret**
   - Configure o **Redirect URI**: `https://nzmherisqehvzhmsxmeb.supabase.co/functions/v1/google-ads-callback`
6. Obtenha também um **Developer Token** no Google Ads

---

## Etapa 2: Estrutura do Banco de Dados

### Novas tabelas a serem criadas:

**1. `ads_integrations`** - Armazena as conexões OAuth dos usuários
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Chave primária |
| user_id | uuid | Referência ao usuário |
| platform | text | 'meta' ou 'google' |
| account_id | text | ID da conta de anúncios |
| account_name | text | Nome da conta |
| access_token | text | Token de acesso (criptografado) |
| refresh_token | text | Token de refresh (criptografado) |
| token_expires_at | timestamp | Expiração do token |
| status | text | 'active', 'expired', 'revoked' |
| last_sync_at | timestamp | Última sincronização |

**2. `ads_campaigns`** - Campanhas sincronizadas das plataformas
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Chave primária |
| integration_id | uuid | FK para ads_integrations |
| external_id | text | ID da campanha na plataforma |
| name | text | Nome da campanha |
| status | text | 'ACTIVE', 'PAUSED', etc. |
| objective | text | Objetivo da campanha |
| budget_daily | numeric | Orçamento diário |
| budget_lifetime | numeric | Orçamento total |
| spend | numeric | Gasto até o momento |
| impressions | integer | Impressões |
| clicks | integer | Cliques |
| conversions | integer | Conversões |
| start_date | date | Data de início |
| end_date | date | Data de término |
| marca | text | Marca associada (manual) |
| synced_at | timestamp | Data da sincronização |

**3. `ads_creatives`** - Anúncios/Criativos de cada campanha
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Chave primária |
| campaign_id | uuid | FK para ads_campaigns |
| external_id | text | ID do anúncio na plataforma |
| name | text | Nome do anúncio |
| status | text | Status do anúncio |
| format | text | Tipo (image, video, carousel) |
| preview_url | text | URL de preview |
| spend | numeric | Gasto do anúncio |
| impressions | integer | Impressões |
| clicks | integer | Cliques |
| ctr | numeric | Taxa de clique |
| synced_at | timestamp | Data da sincronização |

---

## Etapa 3: Edge Functions a Criar

### 3.1 `meta-ads-auth` - Iniciar OAuth do Meta
- Gera URL de autorização OAuth
- Redireciona usuário para login no Facebook

### 3.2 `meta-ads-callback` - Callback OAuth do Meta
- Recebe código de autorização
- Troca por access_token e refresh_token
- Salva credenciais na tabela `ads_integrations`

### 3.3 `meta-ads-sync` - Sincronizar dados do Meta
- Busca campanhas ativas da conta
- Busca anúncios de cada campanha
- Atualiza tabelas `ads_campaigns` e `ads_creatives`

### 3.4 `google-ads-auth` - Iniciar OAuth do Google
- Similar ao Meta, para Google Ads

### 3.5 `google-ads-callback` - Callback OAuth do Google
- Processa retorno da autorização Google

### 3.6 `google-ads-sync` - Sincronizar dados do Google
- Busca campanhas e anúncios via Google Ads API

### 3.7 `ads-sync-scheduler` - Sincronização Agendada (Cron)
- Executa a cada hora (configurável)
- Atualiza dados de todas as integrações ativas

---

## Etapa 4: Interface do Usuário

### 4.1 Página de Configurações de Integrações
Nova página `/integracoes` com:
- Botões para conectar Meta e Google
- Lista de contas conectadas
- Status de cada conexão
- Opção de desconectar

### 4.2 Atualização do Dashboard de Mídia On
- Nova aba ou seção "Campanhas Ativas"
- Tabela com campanhas sincronizadas
- Métricas em tempo real (impressões, cliques, gastos)
- Filtros por plataforma, status, marca
- Associação de campanhas com marcas do sistema

### 4.3 Visualização de Anúncios
- Clique em campanha expande os anúncios
- Preview visual dos criativos
- Métricas individuais por anúncio

---

## Etapa 5: Secrets Necessários

Será necessário configurar os seguintes secrets no projeto:

| Secret | Descrição |
|--------|-----------|
| META_APP_ID | App ID do Meta for Developers |
| META_APP_SECRET | App Secret do Meta |
| GOOGLE_ADS_CLIENT_ID | Client ID do Google Cloud |
| GOOGLE_ADS_CLIENT_SECRET | Client Secret do Google Cloud |
| GOOGLE_ADS_DEVELOPER_TOKEN | Developer Token do Google Ads |

---

## Etapa 6: Segurança

### Políticas RLS para novas tabelas:
- Usuários só podem ver/editar suas próprias integrações
- Admins podem visualizar todas as integrações
- Tokens são criptografados antes de salvar no banco

### Validações:
- Tokens OAuth validados antes de cada sync
- Rate limiting para evitar bloqueio das APIs
- Logs de auditoria para cada sincronização

---

## Fluxo de Implementação Sugerido

| Fase | Descrição | Estimativa |
|------|-----------|------------|
| **Fase 1** | Estrutura de banco de dados (tabelas + RLS) | 1-2 mensagens |
| **Fase 2** | Edge Functions de OAuth (Meta + Google) | 3-4 mensagens |
| **Fase 3** | Edge Functions de sincronização | 2-3 mensagens |
| **Fase 4** | Página de configuração de integrações | 1-2 mensagens |
| **Fase 5** | Atualização do Dashboard Mídia On | 2-3 mensagens |
| **Fase 6** | Testes e ajustes finais | 1-2 mensagens |

---

## Considerações Importantes

### Limitações das APIs:
- **Meta**: Rate limit de 200 chamadas/hora por conta
- **Google Ads**: Quota diária variável por projeto
- Ambas requerem revisão de aplicativo para produção

### Manutenção:
- Tokens do Meta expiram em 60 dias (refresh automático)
- Tokens do Google expiram em 1 hora (refresh automático)
- Monitoramento de erros de sincronização

### Custos:
- Ambas as APIs são gratuitas para uso básico
- Google Ads API requer conta de desenvolvedor aprovada

---

## Próximos Passos

Para iniciar a implementação, você precisará:

1. **Criar os aplicativos** no Meta for Developers e Google Cloud Console
2. **Obter as credenciais** (App IDs, Secrets, Developer Token)
3. **Adicionar os secrets** ao projeto via configuração
4. **Aprovar este plano** para iniciar a implementação técnica

Você gostaria de prosseguir com a implementação? Posso começar criando a estrutura de banco de dados e as primeiras Edge Functions.
