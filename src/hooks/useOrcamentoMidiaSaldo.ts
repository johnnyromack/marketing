import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface OrcamentoMidiaSaldo {
  id: string;
  marca: string;
  unidade: string | null;
  mes: string;
  mes_numero: number;
  ano: number;
  tipo: string;
  valor_orcado: number;
  verba_extra: number;
  valor_utilizado: number;
  saldo_disponivel: number;
}

// Função auxiliar para calcular valor utilizado de uma tabela de mídia
async function calcularValorUtilizado(
  tipo: string,
  marca: string,
  unidade: string | null,
  mesNumero: number,
  ano: number
): Promise<number> {
  let total = 0;

  if (tipo === 'midia_on') {
    const { data } = await supabase
      .from('midia_on')
      .select('valor_realizado')
      .eq('marca', marca)
      .eq('mes_numero', mesNumero)
      .eq('ano', ano);
    
    if (data) {
      total = data.reduce((sum, item) => sum + (item.valor_realizado || 0), 0);
    }
  } else if (tipo === 'midia_off') {
    const { data } = await supabase
      .from('midia_off')
      .select('valor_realizado')
      .eq('marca', marca)
      .eq('mes_numero', mesNumero)
      .eq('ano', ano);
    
    if (data) {
      total = data.reduce((sum, item) => sum + (item.valor_realizado || 0), 0);
    }
  } else if (tipo === 'eventos') {
    const { data } = await supabase
      .from('eventos')
      .select('orcamento_evento')
      .eq('marca', marca)
      .eq('mes_numero', mesNumero)
      .eq('ano', ano);
    
    if (data) {
      total = data.reduce((sum, item) => sum + (item.orcamento_evento || 0), 0);
    }
  } else if (tipo === 'brindes') {
    const { data } = await supabase
      .from('brindes')
      .select('valor_realizado')
      .eq('marca', marca)
      .eq('mes_numero', mesNumero)
      .eq('ano', ano);
    
    if (data) {
      total = data.reduce((sum, item) => sum + (item.valor_realizado || 0), 0);
    }
  }

  return total;
}

export const useOrcamentosMidiaSaldo = () => {
  const [saldos, setSaldos] = useState<Map<string, OrcamentoMidiaSaldo>>(new Map());
  const [loading, setLoading] = useState(true);

  const fetchSaldos = useCallback(async () => {
    setLoading(true);
    
    try {
      // Buscar todos os orçamentos aprovados
      const { data: orcamentos, error } = await supabase
        .from('orcamentos')
        .select('*')
        .eq('status', 'aprovado');

      if (error) throw error;

      if (!orcamentos) {
        setSaldos(new Map());
        return;
      }

      // Para cada orçamento, calcular o valor utilizado
      const saldosMap = new Map<string, OrcamentoMidiaSaldo>();
      
      await Promise.all(
        orcamentos.map(async (orc) => {
          const valorUtilizado = await calcularValorUtilizado(
            orc.tipo,
            orc.marca,
            orc.unidade,
            orc.mes_numero,
            orc.ano
          );

          const valorTotal = (orc.valor_orcado || 0) + (orc.verba_extra || 0);
          const saldoDisponivel = valorTotal - valorUtilizado;

          saldosMap.set(orc.id, {
            id: orc.id,
            marca: orc.marca,
            unidade: orc.unidade,
            mes: orc.mes,
            mes_numero: orc.mes_numero,
            ano: orc.ano,
            tipo: orc.tipo,
            valor_orcado: orc.valor_orcado || 0,
            verba_extra: orc.verba_extra || 0,
            valor_utilizado: valorUtilizado,
            saldo_disponivel: saldoDisponivel,
          });
        })
      );

      setSaldos(saldosMap);
    } catch (error) {
      console.error('Erro ao buscar saldos:', error);
      setSaldos(new Map());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSaldos();
  }, [fetchSaldos]);

  return { saldos, loading, refetch: fetchSaldos };
};
