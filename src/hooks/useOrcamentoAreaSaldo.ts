import { useState, useEffect, useCallback } from 'react';

export interface OrcamentoAreaSaldo {
  tipoCustoId: string;
  tipoCustoNome: string;
  marca: string;
  ano: number;
  valorOrcado: number;
  valorUtilizado: number;
  saldoDisponivel: number;
}

/**
 * Hook para buscar saldo de orçamento de área
 * NOTA: Requer tabelas 'controle_orcamentario' e 'tipos_custo' no banco de dados
 * Para usar este hook, primeiro crie as tabelas necessárias via migration
 */
export const useOrcamentoAreaSaldo = (
  tipoCustoId: string | null | undefined,
  tipoCustoNome: string,
  marca: string,
  ano: number
) => {
  const [saldo, setSaldo] = useState<OrcamentoAreaSaldo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Hook desabilitado - tabelas controle_orcamentario e tipos_custo não existem ainda
    // Quando as tabelas forem criadas, implementar a lógica de busca
    setSaldo(null);
    setLoading(false);
  }, [tipoCustoId, tipoCustoNome, marca, ano]);

  return { saldo, loading };
};

/**
 * Hook para buscar resumo de todos os orçamentos de área
 * NOTA: Requer tabelas 'controle_orcamentario' e 'tipos_custo' no banco de dados
 */
export const useOrcamentosAreaResumo = (marca: string, ano: number) => {
  const [saldos, setSaldos] = useState<OrcamentoAreaSaldo[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSaldos = useCallback(async () => {
    // Hook desabilitado - tabelas não existem ainda
    setSaldos([]);
    setLoading(false);
  }, [marca, ano]);

  useEffect(() => {
    fetchSaldos();
  }, [fetchSaldos]);

  return { saldos, loading, refetch: fetchSaldos };
};
