import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useActivityLog } from '@/hooks/useActivityLog';

export interface Marca {
  id: string;
  nome: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Unidade {
  id: string;
  marca_id: string;
  nome: string;
  orcamento_proprio: boolean;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  endereco?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  marca?: {
    id: string;
    nome: string;
  };
}

export const useMarcas = () => {
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(true);
  const { logActivity } = useActivityLog();

  const fetchMarcas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('marcas')
        .select('*')
        .order('nome');

      if (error) throw error;
      setMarcas(data || []);
    } catch (error: any) {
      console.error('Error fetching marcas:', error);
      toast.error('Erro ao carregar marcas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarcas();
  }, []);

  const createMarca = async (nome: string) => {
    try {
      const { data, error } = await supabase
        .from('marcas')
        .insert({ nome })
        .select()
        .single();

      if (error) throw error;
      await logActivity('insert', 'marcas', data?.id || null, { nome });
      toast.success('Marca criada com sucesso');
      await fetchMarcas();
      return data;
    } catch (error: any) {
      console.error('Error creating marca:', error);
      if (error.code === '23505') {
        toast.error('Já existe uma marca com este nome');
      } else {
        toast.error('Erro ao criar marca');
      }
      return null;
    }
  };

  const updateMarca = async (id: string, data: Partial<Marca>) => {
    try {
      const { error } = await supabase
        .from('marcas')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      await logActivity('update', 'marcas', id, { nome: data.nome, ativo: data.ativo });
      toast.success('Marca atualizada com sucesso');
      await fetchMarcas();
      return true;
    } catch (error: any) {
      console.error('Error updating marca:', error);
      toast.error('Erro ao atualizar marca');
      return false;
    }
  };

  const deleteMarca = async (id: string) => {
    const marcaToDelete = marcas.find(m => m.id === id);
    try {
      const { error } = await supabase
        .from('marcas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await logActivity('delete', 'marcas', id, { nome: marcaToDelete?.nome });
      toast.success('Marca excluída com sucesso');
      await fetchMarcas();
      return true;
    } catch (error: any) {
      console.error('Error deleting marca:', error);
      toast.error('Erro ao excluir marca. Verifique se não há unidades vinculadas.');
      return false;
    }
  };

  return {
    marcas,
    loading,
    fetchMarcas,
    createMarca,
    updateMarca,
    deleteMarca,
    activeMarcas: marcas.filter(m => m.ativo)
  };
};

export const useUnidades = (marcaId?: string) => {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const { logActivity } = useActivityLog();

  const fetchUnidades = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('unidades')
        .select('*, marca:marcas(id, nome)')
        .order('nome');

      if (marcaId) {
        query = query.eq('marca_id', marcaId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setUnidades(data || []);
    } catch (error: any) {
      console.error('Error fetching unidades:', error);
      toast.error('Erro ao carregar unidades');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnidades();
  }, [marcaId]);

  const createUnidade = async (data: { 
    marca_id: string; 
    nome: string; 
    orcamento_proprio: boolean;
    endereco?: string;
    latitude?: number | null;
    longitude?: number | null;
  }) => {
    try {
      const { data: newUnidade, error } = await supabase
        .from('unidades')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      await logActivity('insert', 'unidades', newUnidade?.id || null, { nome: data.nome, marca_id: data.marca_id });
      toast.success('Unidade criada com sucesso');
      await fetchUnidades();
      return newUnidade;
    } catch (error: any) {
      console.error('Error creating unidade:', error);
      if (error.code === '23505') {
        toast.error('Já existe uma unidade com este nome para esta marca');
      } else {
        toast.error('Erro ao criar unidade');
      }
      return null;
    }
  };

  const updateUnidade = async (id: string, data: Partial<Unidade>) => {
    try {
      const { error } = await supabase
        .from('unidades')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      await logActivity('update', 'unidades', id, { nome: data.nome, ativo: data.ativo });
      toast.success('Unidade atualizada com sucesso');
      await fetchUnidades();
      return true;
    } catch (error: any) {
      console.error('Error updating unidade:', error);
      toast.error('Erro ao atualizar unidade');
      return false;
    }
  };

  const deleteUnidade = async (id: string) => {
    const unidadeToDelete = unidades.find(u => u.id === id);
    try {
      const { error } = await supabase
        .from('unidades')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await logActivity('delete', 'unidades', id, { nome: unidadeToDelete?.nome });
      toast.success('Unidade excluída com sucesso');
      await fetchUnidades();
      return true;
    } catch (error: any) {
      console.error('Error deleting unidade:', error);
      toast.error('Erro ao excluir unidade');
      return false;
    }
  };

  return {
    unidades,
    loading,
    fetchUnidades,
    createUnidade,
    updateUnidade,
    deleteUnidade,
    activeUnidades: unidades.filter(u => u.ativo)
  };
};

// ── Ad Accounts (ads_integrations with display_name + marca_id) ───────────────

export interface AdAccount {
  id: string;
  platform: string;
  account_id: string;
  account_name: string;
  display_name: string | null;
  marca_id: string | null;
  status: string;
}

export const useAdAccounts = () => {
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ads_integrations')
        .select('id, platform, account_id, account_name, display_name, marca_id, status')
        .in('status', ['active', 'connected'])
        .order('platform')
        .order('account_name');
      if (error) throw error;
      // Deduplicate: same account_id + platform may appear multiple times (one per user token)
      const seen = new Set<string>();
      const unique = (data || []).filter((r: AdAccount) => {
        const key = `${r.platform}:${r.account_id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setAccounts(unique);
    } catch (err) {
      console.error('Error fetching ad accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const updateAccount = async (id: string, updates: { display_name?: string | null; marca_id?: string | null }) => {
    try {
      const { error } = await supabase
        .from('ads_integrations')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
      setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
      toast.success('Conta atualizada');
      return true;
    } catch (err) {
      toast.error('Erro ao atualizar conta');
      return false;
    }
  };

  // When display_name/marca_id is set on one record, apply to all records with same account_id+platform
  const updateAccountByAccountId = async (
    accountId: string,
    platform: string,
    updates: { display_name?: string | null; marca_id?: string | null }
  ) => {
    try {
      const { error } = await supabase
        .from('ads_integrations')
        .update(updates)
        .eq('account_id', accountId)
        .eq('platform', platform);
      if (error) throw error;
      setAccounts(prev =>
        prev.map(a => a.account_id === accountId && a.platform === platform ? { ...a, ...updates } : a)
      );
      toast.success('Conta atualizada');
      return true;
    } catch (err) {
      toast.error('Erro ao atualizar conta');
      return false;
    }
  };

  return { accounts, loading, fetchAccounts, updateAccount, updateAccountByAccountId };
};

// Helper hook to get unidades by marca name (for backwards compatibility)
export const useUnidadesByMarca = (marcaNome: string) => {
  const [unidades, setUnidades] = useState<string[]>(['Geral']);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUnidades = async () => {
      if (!marcaNome) {
        setUnidades(['Geral']);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('unidades')
          .select('nome, marcas!inner(nome)')
          .eq('marcas.nome', marcaNome)
          .eq('ativo', true)
          .order('nome');

        if (error) throw error;
        const nomes = data?.map(u => u.nome) || ['Geral'];
        setUnidades(nomes.length > 0 ? nomes : ['Geral']);
      } catch (error) {
        console.error('Error fetching unidades by marca:', error);
        setUnidades(['Geral']);
      } finally {
        setLoading(false);
      }
    };

    fetchUnidades();
  }, [marcaNome]);

  return { unidades, loading };
};
