export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          record_id: string | null
          table_name: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          record_id?: string | null
          table_name: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          record_id?: string | null
          table_name?: string
          user_id?: string
        }
        Relationships: []
      }
      ads_campaigns: {
        Row: {
          budget_daily: number | null
          budget_lifetime: number | null
          clicks: number | null
          conversions: number | null
          cpc: number | null
          cpm: number | null
          created_at: string
          ctr: number | null
          end_date: string | null
          external_id: string
          id: string
          impressions: number | null
          integration_id: string
          marca: string | null
          name: string
          objective: string | null
          spend: number | null
          start_date: string | null
          status: string
          synced_at: string
          unidade: string | null
          updated_at: string
        }
        Insert: {
          budget_daily?: number | null
          budget_lifetime?: number | null
          clicks?: number | null
          conversions?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string
          ctr?: number | null
          end_date?: string | null
          external_id: string
          id?: string
          impressions?: number | null
          integration_id: string
          marca?: string | null
          name: string
          objective?: string | null
          spend?: number | null
          start_date?: string | null
          status?: string
          synced_at?: string
          unidade?: string | null
          updated_at?: string
        }
        Update: {
          budget_daily?: number | null
          budget_lifetime?: number | null
          clicks?: number | null
          conversions?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string
          ctr?: number | null
          end_date?: string | null
          external_id?: string
          id?: string
          impressions?: number | null
          integration_id?: string
          marca?: string | null
          name?: string
          objective?: string | null
          spend?: number | null
          start_date?: string | null
          status?: string
          synced_at?: string
          unidade?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ads_campaigns_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "ads_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      ads_creatives: {
        Row: {
          campaign_id: string
          clicks: number | null
          conversions: number | null
          created_at: string
          ctr: number | null
          external_id: string
          format: string | null
          id: string
          impressions: number | null
          name: string
          preview_url: string | null
          spend: number | null
          status: string
          synced_at: string
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          campaign_id: string
          clicks?: number | null
          conversions?: number | null
          created_at?: string
          ctr?: number | null
          external_id: string
          format?: string | null
          id?: string
          impressions?: number | null
          name: string
          preview_url?: string | null
          spend?: number | null
          status?: string
          synced_at?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          clicks?: number | null
          conversions?: number | null
          created_at?: string
          ctr?: number | null
          external_id?: string
          format?: string | null
          id?: string
          impressions?: number | null
          name?: string
          preview_url?: string | null
          spend?: number | null
          status?: string
          synced_at?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ads_creatives_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ads_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      ads_integrations: {
        Row: {
          access_token: string
          account_id: string
          account_name: string | null
          created_at: string
          id: string
          last_sync_at: string | null
          platform: string
          refresh_token: string | null
          status: string
          sync_error: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          account_id: string
          account_name?: string | null
          created_at?: string
          id?: string
          last_sync_at?: string | null
          platform: string
          refresh_token?: string | null
          status?: string
          sync_error?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          account_id?: string
          account_name?: string | null
          created_at?: string
          id?: string
          last_sync_at?: string | null
          platform?: string
          refresh_token?: string | null
          status?: string
          sync_error?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      alert_contacts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      alert_logs: {
        Row: {
          account_id: string | null
          alert_type: string
          channel: string
          contact_id: string | null
          id: string
          message: string | null
          sent_at: string
          status: string | null
        }
        Insert: {
          account_id?: string | null
          alert_type: string
          channel: string
          contact_id?: string | null
          id?: string
          message?: string | null
          sent_at?: string
          status?: string | null
        }
        Update: {
          account_id?: string | null
          alert_type?: string
          channel?: string
          contact_id?: string | null
          id?: string
          message?: string | null
          sent_at?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "platform_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_logs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "alert_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_schedule_settings: {
        Row: {
          allowed_days: number[] | null
          created_at: string
          end_time: string | null
          id: string
          is_active: boolean | null
          start_time: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          allowed_days?: number[] | null
          created_at?: string
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          start_time?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          allowed_days?: number[] | null
          created_at?: string
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          start_time?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      alert_settings: {
        Row: {
          alert_critical_balance: boolean | null
          alert_low_balance: boolean | null
          alert_new_deposit: boolean | null
          alert_projection: boolean | null
          contact_id: string | null
          created_at: string
          critical_balance_threshold: number | null
          id: string
          low_balance_threshold: number | null
          marca_id: string | null
          projection_days: number | null
          updated_at: string
        }
        Insert: {
          alert_critical_balance?: boolean | null
          alert_low_balance?: boolean | null
          alert_new_deposit?: boolean | null
          alert_projection?: boolean | null
          contact_id?: string | null
          created_at?: string
          critical_balance_threshold?: number | null
          id?: string
          low_balance_threshold?: number | null
          marca_id?: string | null
          projection_days?: number | null
          updated_at?: string
        }
        Update: {
          alert_critical_balance?: boolean | null
          alert_low_balance?: boolean | null
          alert_new_deposit?: boolean | null
          alert_projection?: boolean | null
          contact_id?: string | null
          created_at?: string
          critical_balance_threshold?: number | null
          id?: string
          low_balance_threshold?: number | null
          marca_id?: string | null
          projection_days?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_settings_marca_id_fkey"
            columns: ["marca_id"]
            isOneToOne: false
            referencedRelation: "marcas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_settings_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "alert_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      api_configurations: {
        Row: {
          config_key: string
          config_value: string | null
          created_at: string
          description: string | null
          id: string
          is_configured: boolean | null
          updated_at: string
        }
        Insert: {
          config_key: string
          config_value?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_configured?: boolean | null
          updated_at?: string
        }
        Update: {
          config_key?: string
          config_value?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_configured?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      brand_knowledge: {
        Row: {
          content: string
          created_at: string
          file_name: string | null
          file_path: string | null
          id: string
          marca_id: string
          metadata: Json | null
          source_type: string
          source_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          marca_id: string
          metadata?: Json | null
          source_type?: string
          source_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          marca_id?: string
          metadata?: Json | null
          source_type?: string
          source_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_knowledge_marca_id_fkey"
            columns: ["marca_id"]
            isOneToOne: false
            referencedRelation: "marcas"
            referencedColumns: ["id"]
          },
        ]
      }
      brindes: {
        Row: {
          ano: number
          categoria: string
          created_at: string
          descricao: string
          fornecedor: string | null
          id: string
          marca: string
          mes: string
          mes_numero: number
          observacoes: string | null
          quantidade: number
          status: string
          unidade: string
          updated_at: string
          user_id: string
          valor_orcado: number
          valor_realizado: number
          valor_unitario: number
        }
        Insert: {
          ano: number
          categoria: string
          created_at?: string
          descricao: string
          fornecedor?: string | null
          id?: string
          marca: string
          mes: string
          mes_numero: number
          observacoes?: string | null
          quantidade?: number
          status?: string
          unidade?: string
          updated_at?: string
          user_id: string
          valor_orcado?: number
          valor_realizado?: number
          valor_unitario?: number
        }
        Update: {
          ano?: number
          categoria?: string
          created_at?: string
          descricao?: string
          fornecedor?: string | null
          id?: string
          marca?: string
          mes?: string
          mes_numero?: number
          observacoes?: string | null
          quantidade?: number
          status?: string
          unidade?: string
          updated_at?: string
          user_id?: string
          valor_orcado?: number
          valor_realizado?: number
          valor_unitario?: number
        }
        Relationships: []
      }
      campanha_mensal_distribuicao: {
        Row: {
          ano: number
          created_at: string
          distribuicao_id: string
          id: string
          mes: number
          observacoes: string | null
          updated_at: string
          valor_alocado: number
          verba_extra: number
        }
        Insert: {
          ano: number
          created_at?: string
          distribuicao_id: string
          id?: string
          mes: number
          observacoes?: string | null
          updated_at?: string
          valor_alocado?: number
          verba_extra?: number
        }
        Update: {
          ano?: number
          created_at?: string
          distribuicao_id?: string
          id?: string
          mes?: number
          observacoes?: string | null
          updated_at?: string
          valor_alocado?: number
          verba_extra?: number
        }
        Relationships: [
          {
            foreignKeyName: "campanha_mensal_distribuicao_distribuicao_id_fkey"
            columns: ["distribuicao_id"]
            isOneToOne: false
            referencedRelation: "campanha_midia_distribuicao"
            referencedColumns: ["id"]
          },
        ]
      }
      campanha_midia_distribuicao: {
        Row: {
          campanha_id: string
          created_at: string
          id: string
          observacoes: string | null
          tipo_midia: string
          updated_at: string
          valor_alocado: number
        }
        Insert: {
          campanha_id: string
          created_at?: string
          id?: string
          observacoes?: string | null
          tipo_midia: string
          updated_at?: string
          valor_alocado?: number
        }
        Update: {
          campanha_id?: string
          created_at?: string
          id?: string
          observacoes?: string | null
          tipo_midia?: string
          updated_at?: string
          valor_alocado?: number
        }
        Relationships: [
          {
            foreignKeyName: "campanha_midia_distribuicao_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
        ]
      }
      campanhas: {
        Row: {
          ano_fim: number
          ano_inicio: number
          created_at: string
          id: string
          marca: string
          mes_fim: number
          mes_inicio: number
          observacoes: string | null
          orcamento_total: number
          status: string
          unidade: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ano_fim: number
          ano_inicio: number
          created_at?: string
          id?: string
          marca: string
          mes_fim: number
          mes_inicio: number
          observacoes?: string | null
          orcamento_total?: number
          status?: string
          unidade?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ano_fim?: number
          ano_inicio?: number
          created_at?: string
          id?: string
          marca?: string
          mes_fim?: number
          mes_inicio?: number
          observacoes?: string | null
          orcamento_total?: number
          status?: string
          unidade?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      controle_orcamentario: {
        Row: {
          ano: number
          created_at: string
          data_solicitacao: string | null
          descricao: string
          fornecedor: string | null
          id: string
          marca: string
          mes: string
          mes_numero: number
          numero_chamado: string | null
          numero_documento: string | null
          observacoes: string | null
          previsao_pagamento: string | null
          solicitante: string | null
          status: string
          tipo_custo: string
          tipo_custo_id: string | null
          tipo_pagamento: string
          unidade: string | null
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          ano: number
          created_at?: string
          data_solicitacao?: string | null
          descricao: string
          fornecedor?: string | null
          id?: string
          marca: string
          mes: string
          mes_numero: number
          numero_chamado?: string | null
          numero_documento?: string | null
          observacoes?: string | null
          previsao_pagamento?: string | null
          solicitante?: string | null
          status?: string
          tipo_custo: string
          tipo_custo_id?: string | null
          tipo_pagamento?: string
          unidade?: string | null
          updated_at?: string
          user_id: string
          valor?: number
        }
        Update: {
          ano?: number
          created_at?: string
          data_solicitacao?: string | null
          descricao?: string
          fornecedor?: string | null
          id?: string
          marca?: string
          mes?: string
          mes_numero?: number
          numero_chamado?: string | null
          numero_documento?: string | null
          observacoes?: string | null
          previsao_pagamento?: string | null
          solicitante?: string | null
          status?: string
          tipo_custo?: string
          tipo_custo_id?: string | null
          tipo_pagamento?: string
          unidade?: string | null
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "controle_orcamentario_tipo_custo_id_fkey"
            columns: ["tipo_custo_id"]
            isOneToOne: false
            referencedRelation: "tipos_custo"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_custos: {
        Row: {
          created_at: string
          descricao: string
          evento_id: string
          id: string
          tipo_custo: string
          updated_at: string
          valor_orcado: number
          valor_realizado: number
        }
        Insert: {
          created_at?: string
          descricao: string
          evento_id: string
          id?: string
          tipo_custo: string
          updated_at?: string
          valor_orcado?: number
          valor_realizado?: number
        }
        Update: {
          created_at?: string
          descricao?: string
          evento_id?: string
          id?: string
          tipo_custo?: string
          updated_at?: string
          valor_orcado?: number
          valor_realizado?: number
        }
        Relationships: [
          {
            foreignKeyName: "evento_custos_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos: {
        Row: {
          ano: number
          categoria: string
          created_at: string
          data_evento: string
          endereco: string | null
          id: string
          latitude: number | null
          longitude: number | null
          marca: string
          mes: string
          mes_numero: number
          nome_evento: string
          observacoes: string | null
          orcamento_evento: number
          status: string
          unidade: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ano: number
          categoria: string
          created_at?: string
          data_evento: string
          endereco?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          marca: string
          mes: string
          mes_numero: number
          nome_evento: string
          observacoes?: string | null
          orcamento_evento?: number
          status?: string
          unidade?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ano?: number
          categoria?: string
          created_at?: string
          data_evento?: string
          endereco?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          marca?: string
          mes?: string
          mes_numero?: number
          nome_evento?: string
          observacoes?: string | null
          orcamento_evento?: number
          status?: string
          unidade?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fornecedores: {
        Row: {
          ativo: boolean
          cnpj: string | null
          contato: string | null
          created_at: string
          email: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cnpj?: string | null
          contato?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cnpj?: string | null
          contato?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      marcas: {
        Row: {
          ativo: boolean
          created_at: string
          daily_budget: number | null
          display_name: string | null
          id: string
          last_balance_update: string | null
          logo_url: string | null
          manual_balance: number | null
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          daily_budget?: number | null
          display_name?: string | null
          id?: string
          last_balance_update?: string | null
          logo_url?: string | null
          manual_balance?: number | null
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          daily_budget?: number | null
          display_name?: string | null
          id?: string
          last_balance_update?: string | null
          logo_url?: string | null
          manual_balance?: number | null
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      midia_off: {
        Row: {
          ano: number
          anuncio_volante: boolean
          bonificacao: boolean
          created_at: string
          data_contratacao: string | null
          data_veiculacao_fim: string | null
          data_veiculacao_inicio: string | null
          fornecedor: string | null
          id: string
          latitude: number | null
          localizacao: string
          longitude: number | null
          marca: string
          mes: string
          mes_numero: number
          observacoes: string | null
          orcamento_off: number
          realizado_producao: number
          saving_midia: number
          saving_producao: number
          status: string
          tipo_midia: string
          unidade: string
          updated_at: string
          user_id: string
          valor_midia: number
          valor_producao: number
          valor_realizado: number
        }
        Insert: {
          ano: number
          anuncio_volante?: boolean
          bonificacao?: boolean
          created_at?: string
          data_contratacao?: string | null
          data_veiculacao_fim?: string | null
          data_veiculacao_inicio?: string | null
          fornecedor?: string | null
          id?: string
          latitude?: number | null
          localizacao: string
          longitude?: number | null
          marca: string
          mes: string
          mes_numero: number
          observacoes?: string | null
          orcamento_off?: number
          realizado_producao?: number
          saving_midia?: number
          saving_producao?: number
          status?: string
          tipo_midia: string
          unidade?: string
          updated_at?: string
          user_id: string
          valor_midia?: number
          valor_producao?: number
          valor_realizado?: number
        }
        Update: {
          ano?: number
          anuncio_volante?: boolean
          bonificacao?: boolean
          created_at?: string
          data_contratacao?: string | null
          data_veiculacao_fim?: string | null
          data_veiculacao_inicio?: string | null
          fornecedor?: string | null
          id?: string
          latitude?: number | null
          localizacao?: string
          longitude?: number | null
          marca?: string
          mes?: string
          mes_numero?: number
          observacoes?: string | null
          orcamento_off?: number
          realizado_producao?: number
          saving_midia?: number
          saving_producao?: number
          status?: string
          tipo_midia?: string
          unidade?: string
          updated_at?: string
          user_id?: string
          valor_midia?: number
          valor_producao?: number
          valor_realizado?: number
        }
        Relationships: []
      }
      midia_on: {
        Row: {
          ano: number
          created_at: string
          diario: number
          fornecedor: string
          id: string
          marca: string
          mes: string
          mes_numero: number
          observacoes: string | null
          orcamento_on: number
          status: string
          unidade: string
          updated_at: string
          user_id: string
          valor_midia: number
          valor_realizado: number
        }
        Insert: {
          ano: number
          created_at?: string
          diario?: number
          fornecedor: string
          id?: string
          marca: string
          mes: string
          mes_numero: number
          observacoes?: string | null
          orcamento_on?: number
          status?: string
          unidade?: string
          updated_at?: string
          user_id: string
          valor_midia?: number
          valor_realizado?: number
        }
        Update: {
          ano?: number
          created_at?: string
          diario?: number
          fornecedor?: string
          id?: string
          marca?: string
          mes?: string
          mes_numero?: number
          observacoes?: string | null
          orcamento_on?: number
          status?: string
          unidade?: string
          updated_at?: string
          user_id?: string
          valor_midia?: number
          valor_realizado?: number
        }
        Relationships: []
      }
      orcamento_area_distribuicao: {
        Row: {
          ano: number
          created_at: string
          id: string
          mes: number
          observacoes: string | null
          orcamento_id: string
          updated_at: string
          valor_orcado: number
          verba_extra: number
        }
        Insert: {
          ano: number
          created_at?: string
          id?: string
          mes: number
          observacoes?: string | null
          orcamento_id: string
          updated_at?: string
          valor_orcado?: number
          verba_extra?: number
        }
        Update: {
          ano?: number
          created_at?: string
          id?: string
          mes?: number
          observacoes?: string | null
          orcamento_id?: string
          updated_at?: string
          valor_orcado?: number
          verba_extra?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_area_distribuicao_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos: {
        Row: {
          ano: number
          ano_seguinte: number | null
          ano_vigente: number | null
          created_at: string
          id: string
          marca: string
          mes: string
          mes_numero: number
          observacoes: string | null
          orcamento_ano_seguinte: number
          orcamento_ano_vigente: number
          orcamento_campanha: number
          status: string
          tipo: string
          unidade: string | null
          updated_at: string
          user_id: string
          valor_orcado: number
          verba_extra: number
        }
        Insert: {
          ano: number
          ano_seguinte?: number | null
          ano_vigente?: number | null
          created_at?: string
          id?: string
          marca: string
          mes: string
          mes_numero: number
          observacoes?: string | null
          orcamento_ano_seguinte?: number
          orcamento_ano_vigente?: number
          orcamento_campanha?: number
          status?: string
          tipo: string
          unidade?: string | null
          updated_at?: string
          user_id: string
          valor_orcado?: number
          verba_extra?: number
        }
        Update: {
          ano?: number
          ano_seguinte?: number | null
          ano_vigente?: number | null
          created_at?: string
          id?: string
          marca?: string
          mes?: string
          mes_numero?: number
          observacoes?: string | null
          orcamento_ano_seguinte?: number
          orcamento_ano_vigente?: number
          orcamento_campanha?: number
          status?: string
          tipo?: string
          unidade?: string | null
          updated_at?: string
          user_id?: string
          valor_orcado?: number
          verba_extra?: number
        }
        Relationships: []
      }
      pending_alerts: {
        Row: {
          account_id: string | null
          alert_type: string
          created_at: string
          id: string
          message_email_html: string | null
          message_email_subject: string | null
          message_whatsapp: string | null
          scheduled_for: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          account_id?: string | null
          alert_type: string
          created_at?: string
          id?: string
          message_email_html?: string | null
          message_email_subject?: string | null
          message_whatsapp?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          account_id?: string | null
          alert_type?: string
          created_at?: string
          id?: string
          message_email_html?: string | null
          message_email_subject?: string | null
          message_whatsapp?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_alerts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "platform_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_accounts: {
        Row: {
          account_id: string
          account_name: string
          balance: number | null
          created_at: string
          currency: string | null
          id: string
          last_sync_at: string | null
          marca_id: string | null
          platform: string
          status: string | null
          updated_at: string
        }
        Insert: {
          account_id: string
          account_name: string
          balance?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          last_sync_at?: string | null
          marca_id?: string | null
          platform: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          account_name?: string
          balance?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          last_sync_at?: string | null
          marca_id?: string | null
          platform?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_accounts_marca_id_fkey"
            columns: ["marca_id"]
            isOneToOne: false
            referencedRelation: "marcas"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_ad_metrics: {
        Row: {
          ad_id: string | null
          clicks: number | null
          conversions: number | null
          cpc: number | null
          created_at: string
          ctr: number | null
          date: string
          id: string
          impressions: number | null
          spend: number | null
        }
        Insert: {
          ad_id?: string | null
          clicks?: number | null
          conversions?: number | null
          cpc?: number | null
          created_at?: string
          ctr?: number | null
          date: string
          id?: string
          impressions?: number | null
          spend?: number | null
        }
        Update: {
          ad_id?: string | null
          clicks?: number | null
          conversions?: number | null
          cpc?: number | null
          created_at?: string
          ctr?: number | null
          date?: string
          id?: string
          impressions?: number | null
          spend?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_ad_metrics_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "platform_ads"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_ads: {
        Row: {
          ad_external_id: string
          campaign_id: string | null
          created_at: string
          description: string | null
          final_url: string | null
          headline: string | null
          id: string
          name: string
          preview_url: string | null
          status: string | null
          thumbnail_url: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          ad_external_id: string
          campaign_id?: string | null
          created_at?: string
          description?: string | null
          final_url?: string | null
          headline?: string | null
          id?: string
          name: string
          preview_url?: string | null
          status?: string | null
          thumbnail_url?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          ad_external_id?: string
          campaign_id?: string | null
          created_at?: string
          description?: string | null
          final_url?: string | null
          headline?: string | null
          id?: string
          name?: string
          preview_url?: string | null
          status?: string | null
          thumbnail_url?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_ads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "platform_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_brand_budgets: {
        Row: {
          budget_amount: number
          created_at: string
          id: string
          marca_id: string
          month: string
          platform: string
          updated_at: string
        }
        Insert: {
          budget_amount?: number
          created_at?: string
          id?: string
          marca_id: string
          month: string
          platform: string
          updated_at?: string
        }
        Update: {
          budget_amount?: number
          created_at?: string
          id?: string
          marca_id?: string
          month?: string
          platform?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_brand_budgets_marca_id_fkey"
            columns: ["marca_id"]
            isOneToOne: false
            referencedRelation: "marcas"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_campaign_metrics: {
        Row: {
          campaign_id: string | null
          clicks: number | null
          conversions: number | null
          cpc: number | null
          created_at: string
          ctr: number | null
          date: string
          id: string
          impressions: number | null
          revenue: number | null
          roas: number | null
          spend: number | null
        }
        Insert: {
          campaign_id?: string | null
          clicks?: number | null
          conversions?: number | null
          cpc?: number | null
          created_at?: string
          ctr?: number | null
          date: string
          id?: string
          impressions?: number | null
          revenue?: number | null
          roas?: number | null
          spend?: number | null
        }
        Update: {
          campaign_id?: string | null
          clicks?: number | null
          conversions?: number | null
          cpc?: number | null
          created_at?: string
          ctr?: number | null
          date?: string
          id?: string
          impressions?: number | null
          revenue?: number | null
          roas?: number | null
          spend?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_campaign_metrics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "platform_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_campaigns: {
        Row: {
          account_id: string | null
          campaign_external_id: string
          created_at: string
          daily_budget: number | null
          end_date: string | null
          id: string
          lifetime_budget: number | null
          name: string
          objective: string | null
          start_date: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          campaign_external_id: string
          created_at?: string
          daily_budget?: number | null
          end_date?: string | null
          id?: string
          lifetime_budget?: number | null
          name: string
          objective?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          campaign_external_id?: string
          created_at?: string
          daily_budget?: number | null
          end_date?: string | null
          id?: string
          lifetime_budget?: number | null
          name?: string
          objective?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_campaigns_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "platform_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_keyword_metrics: {
        Row: {
          average_position: number | null
          clicks: number | null
          conversions: number | null
          cpc: number | null
          created_at: string
          ctr: number | null
          date: string
          id: string
          impressions: number | null
          keyword_id: string | null
          spend: number | null
        }
        Insert: {
          average_position?: number | null
          clicks?: number | null
          conversions?: number | null
          cpc?: number | null
          created_at?: string
          ctr?: number | null
          date: string
          id?: string
          impressions?: number | null
          keyword_id?: string | null
          spend?: number | null
        }
        Update: {
          average_position?: number | null
          clicks?: number | null
          conversions?: number | null
          cpc?: number | null
          created_at?: string
          ctr?: number | null
          date?: string
          id?: string
          impressions?: number | null
          keyword_id?: string | null
          spend?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_keyword_metrics_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "platform_keywords"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_keywords: {
        Row: {
          ad_group_external_id: string | null
          ad_group_name: string | null
          campaign_id: string | null
          created_at: string
          id: string
          keyword_external_id: string
          keyword_text: string
          match_type: string | null
          quality_score: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          ad_group_external_id?: string | null
          ad_group_name?: string | null
          campaign_id?: string | null
          created_at?: string
          id?: string
          keyword_external_id: string
          keyword_text: string
          match_type?: string | null
          quality_score?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          ad_group_external_id?: string | null
          ad_group_name?: string | null
          campaign_id?: string | null
          created_at?: string
          id?: string
          keyword_external_id?: string
          keyword_text?: string
          match_type?: string | null
          quality_score?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_keywords_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "platform_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      publicidade_dados: {
        Row: {
          cac_a1: number
          cac_orcado: number
          cac_real: number
          cpl_a1: number
          cpl_orcado: number
          cpl_prod_a1: number
          cpl_prod_orcado: number
          cpl_prod_real: number
          cpl_real: number
          created_at: string
          id: string
          invest_eventos: number
          invest_google: number
          invest_meta: number
          invest_off: number
          leads_a1: number
          leads_eventos: number
          leads_orcado: number
          leads_prod_a1: number
          leads_prod_orcado: number
          leads_prod_real: number
          leads_real: number
          marca: string
          matriculas_a1: number
          matriculas_orcado: number
          matriculas_real: number
          month: string
          month_number: number
          num_eventos: number
          status: string
          unidade: string
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          cac_a1?: number
          cac_orcado?: number
          cac_real?: number
          cpl_a1?: number
          cpl_orcado?: number
          cpl_prod_a1?: number
          cpl_prod_orcado?: number
          cpl_prod_real?: number
          cpl_real?: number
          created_at?: string
          id?: string
          invest_eventos?: number
          invest_google?: number
          invest_meta?: number
          invest_off?: number
          leads_a1?: number
          leads_eventos?: number
          leads_orcado?: number
          leads_prod_a1?: number
          leads_prod_orcado?: number
          leads_prod_real?: number
          leads_real?: number
          marca: string
          matriculas_a1?: number
          matriculas_orcado?: number
          matriculas_real?: number
          month: string
          month_number: number
          num_eventos?: number
          status?: string
          unidade?: string
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          cac_a1?: number
          cac_orcado?: number
          cac_real?: number
          cpl_a1?: number
          cpl_orcado?: number
          cpl_prod_a1?: number
          cpl_prod_orcado?: number
          cpl_prod_real?: number
          cpl_real?: number
          created_at?: string
          id?: string
          invest_eventos?: number
          invest_google?: number
          invest_meta?: number
          invest_off?: number
          leads_a1?: number
          leads_eventos?: number
          leads_orcado?: number
          leads_prod_a1?: number
          leads_prod_orcado?: number
          leads_prod_real?: number
          leads_real?: number
          marca?: string
          matriculas_a1?: number
          matriculas_orcado?: number
          matriculas_real?: number
          month?: string
          month_number?: number
          num_eventos?: number
          status?: string
          unidade?: string
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      tipos_custo: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
          tipo_orcamento: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          tipo_orcamento?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          tipo_orcamento?: string
          updated_at?: string
        }
        Relationships: []
      }
      unidades: {
        Row: {
          ativo: boolean
          created_at: string
          endereco: string | null
          id: string
          latitude: number | null
          longitude: number | null
          marca_id: string
          nome: string
          orcamento_proprio: boolean
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          endereco?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          marca_id: string
          nome: string
          orcamento_proprio?: boolean
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          endereco?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          marca_id?: string
          nome?: string
          orcamento_proprio?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "unidades_marca_id_fkey"
            columns: ["marca_id"]
            isOneToOne: false
            referencedRelation: "marcas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          gestor_id: string | null
          id: string
          must_change_password: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          gestor_id?: string | null
          id?: string
          must_change_password?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          gestor_id?: string | null
          id?: string
          must_change_password?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      user_roles_safe: {
        Row: {
          created_at: string | null
          gestor_id: string | null
          id: string | null
          must_change_password: boolean | null
          role: Database["public"]["Enums"]["app_role"] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          gestor_id?: never
          id?: string | null
          must_change_password?: boolean | null
          role?: Database["public"]["Enums"]["app_role"] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          gestor_id?: never
          id?: string | null
          must_change_password?: boolean | null
          role?: Database["public"]["Enums"]["app_role"] | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_ad_stats: {
        Args: {
          p_brand_id?: string
          p_from_date?: string
          p_platform?: string
          p_to_date?: string
        }
        Returns: {
          active: number
          total: number
        }[]
      }
      get_all_publicidade_dados: {
        Args: { p_status?: string }
        Returns: {
          cac_a1: number
          cac_orcado: number
          cac_real: number
          cpl_a1: number
          cpl_orcado: number
          cpl_prod_a1: number
          cpl_prod_orcado: number
          cpl_prod_real: number
          cpl_real: number
          created_at: string
          id: string
          invest_eventos: number
          invest_google: number
          invest_meta: number
          invest_off: number
          leads_a1: number
          leads_eventos: number
          leads_orcado: number
          leads_prod_a1: number
          leads_prod_orcado: number
          leads_prod_real: number
          leads_real: number
          marca: string
          matriculas_a1: number
          matriculas_orcado: number
          matriculas_real: number
          month: string
          month_number: number
          num_eventos: number
          status: string
          unidade: string
          updated_at: string
          user_id: string
          year: number
        }[]
        SetofOptions: {
          from: "*"
          to: "publicidade_dados"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_campaign_stats: {
        Args: {
          p_brand_id?: string
          p_from_date?: string
          p_platform?: string
          p_to_date?: string
        }
        Returns: {
          active: number
          paused: number
          total: number
        }[]
      }
      get_daily_metrics: {
        Args: {
          p_brand_id?: string
          p_from_date: string
          p_platform?: string
          p_to_date: string
        }
        Returns: {
          metric_date: string
          total_clicks: number
          total_conversions: number
          total_impressions: number
          total_spend: number
        }[]
      }
      get_midia_totals: {
        Args: { p_ano?: number }
        Returns: {
          row_count: number
          tipo: string
          total_orcado: number
          total_realizado: number
          total_saving: number
        }[]
      }
      get_period_metrics: {
        Args: {
          p_brand_id?: string
          p_from_date: string
          p_platform?: string
          p_to_date: string
        }
        Returns: {
          total_clicks: number
          total_conversions: number
          total_impressions: number
          total_revenue: number
          total_spend: number
        }[]
      }
      get_publicidade_totals: {
        Args: {
          p_marca?: string
          p_month_from?: number
          p_month_to?: number
          p_status?: string
          p_unidade?: string
          p_year_from?: number
          p_year_to?: number
        }
        Returns: {
          avg_cac_a1: number
          avg_cac_orcado: number
          avg_cac_real: number
          avg_cpl_a1: number
          avg_cpl_orcado: number
          avg_cpl_prod_a1: number
          avg_cpl_prod_orcado: number
          avg_cpl_prod_real: number
          avg_cpl_real: number
          row_count: number
          total_invest: number
          total_invest_eventos: number
          total_invest_google: number
          total_invest_meta: number
          total_invest_off: number
          total_leads_a1: number
          total_leads_orcado: number
          total_leads_prod_a1: number
          total_leads_prod_orcado: number
          total_leads_prod_real: number
          total_leads_real: number
          total_matriculas_a1: number
          total_matriculas_orcado: number
          total_matriculas_real: number
        }[]
      }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "gestor" | "editor" | "leitor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "gestor", "editor", "leitor"],
    },
  },
} as const
