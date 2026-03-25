import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActivityLog } from '@/hooks/useActivityLog';
import { toast } from 'sonner';

export interface Orcamento {
  id: string;
  ano: number;
  mes_numero: number;
  mes: string;
  marca: string;
  unidade: string | null;
  tipo: 'midia_on' | 'midia_off' | 'eventos' | 'brindes';
  valor_orcado: number;
  verba_extra: number;
  observacoes: string | null;
  status: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface OrcamentoSaldo {
  orcamento_id: string;
  marca: string;
  unidade: string | null;
  mes_numero: number;
  ano: number;
  tipo: string;
  valor_orcado: number;
  verba_extra: number;
  valor_utilizado: number;
  saldo_disponivel: number;
}

export const useOrcamentos = () => {
  const { user } = useAuth();
  const { logActivity } = useActivityLog();
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrcamentos = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orcamentos')
        .select('*')
        .order('ano', { ascending: false })
        .order('mes_numero', { ascending: false });

      if (error) throw error;
      // Cast the data to our interface since we know the tipo values are constrained by DB
      setOrcamentos((data as Orcamento[]) || []);
    } catch (error: any) {
      console.error('Error fetching orcamentos:', error);
      toast.error('Erro ao carregar orçamentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrcamentos();
  }, [user]);

  const createOrcamento = async (data: Omit<Orcamento, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      const { data: newOrcamento, error } = await supabase
        .from('orcamentos')
        .insert({
          ...data,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      await logActivity('insert', 'orcamentos', newOrcamento?.id || null, { 
        marca: data.marca, 
        mes: data.mes, 
        ano: data.ano, 
        tipo: data.tipo,
        valor: data.valor_orcado 
      });
      toast.success('Orçamento cadastrado com sucesso');
      await fetchOrcamentos();
      return newOrcamento;
    } catch (error: any) {
      console.error('Error creating orcamento:', error);
      if (error.code === '23505') {
        toast.error('Já existe um orçamento para esta combinação de mês/marca/unidade/tipo');
      } else {
        toast.error('Erro ao cadastrar orçamento');
      }
      return null;
    }
  };

  const updateOrcamento = async (id: string, data: Partial<Orcamento>) => {
    try {
      const { error } = await supabase
        .from('orcamentos')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      
      await logActivity('update', 'orcamentos', id, { ...data });
      toast.success('Orçamento atualizado com sucesso');
      await fetchOrcamentos();
      return true;
    } catch (error: any) {
      console.error('Error updating orcamento:', error);
      toast.error('Erro ao atualizar orçamento');
      return false;
    }
  };

  const deleteOrcamento = async (id: string) => {
    const orcToDelete = orcamentos.find(o => o.id === id);
    try {
      const { error } = await supabase
        .from('orcamentos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await logActivity('delete', 'orcamentos', id, { 
        marca: orcToDelete?.marca, 
        mes: orcToDelete?.mes, 
        tipo: orcToDelete?.tipo 
      });
      toast.success('Orçamento excluído com sucesso');
      await fetchOrcamentos();
      return true;
    } catch (error: any) {
      console.error('Error deleting orcamento:', error);
      toast.error('Erro ao excluir orçamento');
      return false;
    }
  };

  const submitForApproval = async (id: string) => {
    const result = await updateOrcamento(id, { status: 'pendente' });
    if (result) {
      await logActivity('status_change', 'orcamentos', id, { new_status: 'pendente' });
    }
    return result;
  };

  const approveOrcamento = async (id: string) => {
    const result = await updateOrcamento(id, { status: 'aprovado' });
    if (result) {
      await logActivity('approve', 'orcamentos', id, { new_status: 'aprovado' });
    }
    return result;
  };

  const rejectOrcamento = async (id: string) => {
    const result = await updateOrcamento(id, { status: 'rascunho' });
    if (result) {
      await logActivity('reject', 'orcamentos', id, { new_status: 'rascunho' });
    }
    return result;
  };

  return {
    orcamentos,
    loading,
    fetchOrcamentos,
    createOrcamento,
    updateOrcamento,
    deleteOrcamento,
    submitForApproval,
    approveOrcamento,
    rejectOrcamento
  };
};

// Hook to get available budget for a specific context
export const useOrcamentoSaldo = (
  tipo: 'midia_on' | 'midia_off' | 'eventos' | 'brindes',
  marca: string,
  unidade: string | null,
  mesNumero: number,
  ano: number
) => {
  const [saldo, setSaldo] = useState<OrcamentoSaldo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSaldo = async () => {
      if (!marca || !mesNumero || !ano) {
        setSaldo(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch approved budget for the brand/unit/month/type
        const { data: orcamento, error: orcError } = await supabase
          .from('orcamentos')
          .select('*')
          .eq('tipo', tipo)
          .eq('marca', marca)
          .eq('mes_numero', mesNumero)
          .eq('ano', ano)
          .eq('status', 'aprovado')
          .or(`unidade.eq.${unidade},unidade.is.null`)
          .order('unidade', { ascending: false, nullsFirst: false })
          .limit(1)
          .maybeSingle();

        if (orcError) throw orcError;

        if (!orcamento) {
          setSaldo(null);
          setLoading(false);
          return;
        }

        // Fetch used amount from the respective table based on tipo
        let valorUtilizado = 0;

        if (tipo === 'midia_on') {
          const { data: records, error: recError } = await supabase
            .from('midia_on')
            .select('valor_realizado')
            .eq('marca', marca)
            .eq('mes_numero', mesNumero)
            .eq('ano', ano);
          
          if (!recError && records) {
            valorUtilizado = records.reduce((sum, r) => sum + Number(r.valor_realizado || 0), 0);
          }
        } else if (tipo === 'midia_off') {
          const { data: records, error: recError } = await supabase
            .from('midia_off')
            .select('valor_realizado, realizado_producao')
            .eq('marca', marca)
            .eq('mes_numero', mesNumero)
            .eq('ano', ano);
          
          if (!recError && records) {
            valorUtilizado = records.reduce((sum, r) => 
              sum + Number(r.valor_realizado || 0) + Number(r.realizado_producao || 0), 0);
          }
        } else if (tipo === 'eventos') {
          const { data: records, error: recError } = await supabase
            .from('eventos')
            .select('orcamento_evento')
            .eq('marca', marca)
            .eq('mes_numero', mesNumero)
            .eq('ano', ano);
          
          if (!recError && records) {
            valorUtilizado = records.reduce((sum, r) => sum + Number(r.orcamento_evento || 0), 0);
          }
        } else if (tipo === 'brindes') {
          const { data: records, error: recError } = await supabase
            .from('brindes')
            .select('valor_realizado')
            .eq('marca', marca)
            .eq('mes_numero', mesNumero)
            .eq('ano', ano);
          
          if (!recError && records) {
            valorUtilizado = records.reduce((sum, r) => sum + Number(r.valor_realizado || 0), 0);
          }
        }

        const valorTotal = Number(orcamento.valor_orcado) + Number(orcamento.verba_extra);
        
        setSaldo({
          orcamento_id: orcamento.id,
          marca: orcamento.marca,
          unidade: orcamento.unidade,
          mes_numero: orcamento.mes_numero,
          ano: orcamento.ano,
          tipo: orcamento.tipo,
          valor_orcado: Number(orcamento.valor_orcado),
          verba_extra: Number(orcamento.verba_extra),
          valor_utilizado: valorUtilizado,
          saldo_disponivel: valorTotal - valorUtilizado
        });
      } catch (error: any) {
        console.error('Error fetching saldo:', error);
        setSaldo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSaldo();
  }, [tipo, marca, unidade, mesNumero, ano]);

  return { saldo, loading };
};
