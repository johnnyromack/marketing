import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface TipoCusto {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
}

export interface ControleRegistro {
  id: string;
  user_id: string;
  ano: number;
  mes: string;
  mes_numero: number;
  numero_chamado: string | null;
  fornecedor: string | null;
  descricao: string;
  marca: string;
  unidade: string | null;
  status: string;
  tipo_custo_id: string | null;
  tipo_custo: string;
  valor: number;
  tipo_pagamento: string;
  numero_documento: string | null;
  solicitante: string | null;
  data_solicitacao: string | null;
  previsao_pagamento: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ControleFormData {
  ano: number;
  mes: string;
  mes_numero: number;
  numero_chamado?: string;
  fornecedor?: string;
  descricao: string;
  marca: string;
  unidade?: string;
  status: string;
  tipo_custo_id?: string;
  tipo_custo: string;
  valor: number;
  tipo_pagamento: string;
  numero_documento?: string;
  solicitante?: string;
  data_solicitacao?: string;
  previsao_pagamento?: string;
  observacoes?: string;
}

export const useControleOrcamentario = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [registros, setRegistros] = useState<ControleRegistro[]>([]);
  const [tiposCusto, setTiposCusto] = useState<TipoCusto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTiposCusto = useCallback(async () => {
    const { data, error } = await supabase
      .from('tipos_custo')
      .select('*')
      .order('nome');

    if (error) {
      console.error('Erro ao buscar tipos de custo:', error);
      return;
    }

    setTiposCusto(data || []);
  }, []);

  const fetchRegistros = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    const { data, error } = await supabase
      .from('controle_orcamentario')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar registros:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os registros.',
        variant: 'destructive',
      });
    } else {
      setRegistros(data || []);
    }

    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchTiposCusto();
    fetchRegistros();
  }, [fetchTiposCusto, fetchRegistros]);

  const createRegistro = async (formData: ControleFormData): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase.from('controle_orcamentario').insert({
      user_id: user.id,
      ...formData,
    });

    if (error) {
      console.error('Erro ao criar registro:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o registro.',
        variant: 'destructive',
      });
      return false;
    }

    toast({
      title: 'Sucesso',
      description: 'Registro salvo com sucesso.',
    });

    await fetchRegistros();
    return true;
  };

  const createMultipleRegistros = async (registrosData: ControleFormData[]): Promise<boolean> => {
    if (!user) return false;

    const registrosComUser = registrosData.map(r => ({
      user_id: user.id,
      ...r,
    }));

    const { error } = await supabase.from('controle_orcamentario').insert(registrosComUser);

    if (error) {
      console.error('Erro ao criar registros:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar os registros.',
        variant: 'destructive',
      });
      return false;
    }

    toast({
      title: 'Sucesso',
      description: `${registrosData.length} registro(s) salvo(s) com sucesso.`,
    });

    await fetchRegistros();
    return true;
  };

  const updateRegistro = async (id: string, updates: Partial<ControleFormData>): Promise<boolean> => {
    const { error } = await supabase
      .from('controle_orcamentario')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Erro ao atualizar registro:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o registro.',
        variant: 'destructive',
      });
      return false;
    }

    toast({
      title: 'Sucesso',
      description: 'Registro atualizado com sucesso.',
    });

    await fetchRegistros();
    return true;
  };

  const deleteRegistro = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('controle_orcamentario')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir registro:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o registro.',
        variant: 'destructive',
      });
      return false;
    }

    toast({
      title: 'Sucesso',
      description: 'Registro excluído com sucesso.',
    });

    await fetchRegistros();
    return true;
  };

  const tiposCustoAtivos = tiposCusto.filter(t => t.ativo);

  return {
    registros,
    tiposCusto,
    tiposCustoAtivos,
    loading,
    fetchRegistros,
    createRegistro,
    createMultipleRegistros,
    updateRegistro,
    deleteRegistro,
  };
};
