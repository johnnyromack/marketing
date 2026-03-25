import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Campanha {
  id: string;
  marca: string;
  unidade: string | null;
  orcamento_total: number;
  mes_inicio: number;
  ano_inicio: number;
  mes_fim: number;
  ano_fim: number;
  status: string;
  observacoes: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CampanhaMidiaDistribuicao {
  id: string;
  campanha_id: string;
  tipo_midia: string;
  valor_alocado: number;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampanhaMensalDistribuicao {
  id: string;
  distribuicao_id: string;
  mes: number;
  ano: number;
  valor_alocado: number;
  verba_extra: number;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampanhaCompleta extends Campanha {
  distribuicoes: (CampanhaMidiaDistribuicao & { mensais: CampanhaMensalDistribuicao[] })[];
}

export const useCampanhas = () => {
  const { user } = useAuth();
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampanhas = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('campanhas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching campanhas:', error);
      toast.error('Erro ao carregar campanhas');
    } else {
      setCampanhas(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCampanhas();
  }, [fetchCampanhas]);

  const getCampanhaCompleta = async (campanhaId: string): Promise<CampanhaCompleta | null> => {
    const { data: campanha, error: campanhaError } = await supabase
      .from('campanhas')
      .select('*')
      .eq('id', campanhaId)
      .single();

    if (campanhaError || !campanha) {
      console.error('Error fetching campanha:', campanhaError);
      return null;
    }

    const { data: distribuicoes, error: distError } = await supabase
      .from('campanha_midia_distribuicao')
      .select('*')
      .eq('campanha_id', campanhaId);

    if (distError) {
      console.error('Error fetching distribuicoes:', distError);
      return { ...campanha, distribuicoes: [] };
    }

    const distComMensais = await Promise.all(
      (distribuicoes || []).map(async (dist) => {
        const { data: mensais } = await supabase
          .from('campanha_mensal_distribuicao')
          .select('*')
          .eq('distribuicao_id', dist.id)
          .order('ano', { ascending: true })
          .order('mes', { ascending: true });

        return { ...dist, mensais: mensais || [] };
      })
    );

    return { ...campanha, distribuicoes: distComMensais };
  };

  const createCampanha = async (
    data: Omit<Campanha, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    autoApprove: boolean = false
  ) => {
    if (!user) return null;

    // autoApprove tem prioridade sobre o status passado nos dados
    const finalStatus = autoApprove ? 'aprovado' : 'rascunho';
    
    const { data: created, error } = await supabase
      .from('campanhas')
      .insert({ ...data, status: finalStatus, user_id: user.id })
      .select()
      .single();

    if (error) {
      console.error('Error creating campanha:', error);
      toast.error('Erro ao criar campanha');
      return null;
    }

    await fetchCampanhas();
    return created;
  };

  const updateCampanha = async (id: string, data: Partial<Campanha>) => {
    const { error } = await supabase
      .from('campanhas')
      .update(data)
      .eq('id', id);

    if (error) {
      console.error('Error updating campanha:', error);
      toast.error('Erro ao atualizar campanha');
      return false;
    }

    await fetchCampanhas();
    return true;
  };

  const deleteCampanha = async (id: string) => {
    const { error } = await supabase
      .from('campanhas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting campanha:', error);
      toast.error('Erro ao excluir campanha');
      return false;
    }

    await fetchCampanhas();
    toast.success('Campanha excluída');
    return true;
  };

  const submitForApproval = async (id: string) => {
    // Verificar se tem distribuições
    const { data: dist } = await supabase
      .from('campanha_midia_distribuicao')
      .select('id')
      .eq('campanha_id', id);

    if (!dist || dist.length === 0) {
      toast.error('Distribua a verba antes de enviar para aprovação');
      return false;
    }

    return updateCampanha(id, { status: 'pendente' });
  };

  const approveCampanha = async (id: string) => {
    const result = await updateCampanha(id, { status: 'aprovado' });
    if (result) toast.success('Campanha aprovada!');
    return result;
  };

  const rejectCampanha = async (id: string) => {
    const result = await updateCampanha(id, { status: 'rascunho' });
    if (result) toast.info('Campanha rejeitada');
    return result;
  };

  // Distribuição por tipo de mídia
  const saveDistribuicaoMidia = async (
    campanhaId: string,
    tipoMidia: string,
    valorAlocado: number,
    observacoes?: string
  ) => {
    // Upsert - update if exists, insert if not
    const { data: existing } = await supabase
      .from('campanha_midia_distribuicao')
      .select('id')
      .eq('campanha_id', campanhaId)
      .eq('tipo_midia', tipoMidia)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('campanha_midia_distribuicao')
        .update({ valor_alocado: valorAlocado, observacoes })
        .eq('id', existing.id);

      if (error) {
        console.error('Error updating distribuicao:', error);
        return null;
      }
      return existing.id;
    } else {
      const { data: created, error } = await supabase
        .from('campanha_midia_distribuicao')
        .insert({ campanha_id: campanhaId, tipo_midia: tipoMidia, valor_alocado: valorAlocado, observacoes })
        .select()
        .single();

      if (error) {
        console.error('Error creating distribuicao:', error);
        return null;
      }
      return created.id;
    }
  };

  const deleteDistribuicaoMidia = async (distribuicaoId: string) => {
    const { error } = await supabase
      .from('campanha_midia_distribuicao')
      .delete()
      .eq('id', distribuicaoId);

    return !error;
  };

  // Distribuição mensal
  const saveDistribuicaoMensal = async (
    distribuicaoId: string,
    mes: number,
    ano: number,
    valorAlocado: number,
    verbaExtra: number = 0,
    observacoes?: string
  ) => {
    const { data: existing } = await supabase
      .from('campanha_mensal_distribuicao')
      .select('id')
      .eq('distribuicao_id', distribuicaoId)
      .eq('mes', mes)
      .eq('ano', ano)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('campanha_mensal_distribuicao')
        .update({ valor_alocado: valorAlocado, verba_extra: verbaExtra, observacoes })
        .eq('id', existing.id);

      return !error;
    } else {
      const { error } = await supabase
        .from('campanha_mensal_distribuicao')
        .insert({ distribuicao_id: distribuicaoId, mes, ano, valor_alocado: valorAlocado, verba_extra: verbaExtra, observacoes });

      return !error;
    }
  };

  const deleteDistribuicaoMensal = async (id: string) => {
    const { error } = await supabase
      .from('campanha_mensal_distribuicao')
      .delete()
      .eq('id', id);

    return !error;
  };

  return {
    campanhas,
    loading,
    refetch: fetchCampanhas,
    getCampanhaCompleta,
    createCampanha,
    updateCampanha,
    deleteCampanha,
    submitForApproval,
    approveCampanha,
    rejectCampanha,
    saveDistribuicaoMidia,
    deleteDistribuicaoMidia,
    saveDistribuicaoMensal,
    deleteDistribuicaoMensal,
  };
};
