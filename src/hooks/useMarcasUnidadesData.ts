import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Marca {
  id: string;
  nome: string;
  ativo: boolean;
}

interface Unidade {
  id: string;
  nome: string;
  marca_id: string;
  ativo: boolean;
  orcamento_proprio: boolean;
}

// Cache global para evitar múltiplas requisições
let marcasCache: Marca[] | null = null;
let unidadesCache: Unidade[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60000; // 1 minuto

export const useMarcasUnidadesData = () => {
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    
    // Usar cache se ainda válido
    if (!forceRefresh && marcasCache && unidadesCache && (now - cacheTimestamp) < CACHE_DURATION) {
      setMarcas(marcasCache);
      setUnidades(unidadesCache);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const [marcasRes, unidadesRes] = await Promise.all([
      supabase.from('marcas').select('*').eq('ativo', true).order('nome'),
      supabase.from('unidades').select('*').eq('ativo', true).order('nome'),
    ]);

    const fetchedMarcas = (marcasRes.data || []) as Marca[];
    const fetchedUnidades = (unidadesRes.data || []) as Unidade[];

    // Atualizar cache
    marcasCache = fetchedMarcas;
    unidadesCache = fetchedUnidades;
    cacheTimestamp = now;

    setMarcas(fetchedMarcas);
    setUnidades(fetchedUnidades);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Lista de nomes de marcas ativas
  const marcasNomes = marcas.map(m => m.nome);

  // Função para obter unidades de uma marca pelo nome
  const getUnidadesByMarcaNome = useCallback((marcaNome: string): string[] => {
    if (!marcaNome) return ['Geral'];
    
    const marca = marcas.find(m => m.nome === marcaNome);
    if (!marca) return ['Geral'];
    
    const unidadesDaMarca = unidades
      .filter(u => u.marca_id === marca.id)
      .map(u => u.nome);
    
    return unidadesDaMarca.length > 0 ? unidadesDaMarca : ['Geral'];
  }, [marcas, unidades]);

  // Função para obter unidades com orçamento próprio
  const getUnidadesComOrcamentoProprio = useCallback((marcaNome: string): string[] => {
    if (!marcaNome) return [];
    
    const marca = marcas.find(m => m.nome === marcaNome);
    if (!marca) return [];
    
    return unidades
      .filter(u => u.marca_id === marca.id && u.orcamento_proprio)
      .map(u => u.nome);
  }, [marcas, unidades]);

  // Verificar se uma unidade tem orçamento próprio
  const hasOrcamentoProprio = useCallback((marcaNome: string, unidadeNome: string): boolean => {
    if (!marcaNome || !unidadeNome) return false;
    
    const marca = marcas.find(m => m.nome === marcaNome);
    if (!marca) return false;
    
    const unidade = unidades.find(u => u.marca_id === marca.id && u.nome === unidadeNome);
    return unidade?.orcamento_proprio || false;
  }, [marcas, unidades]);

  // Função para forçar atualização do cache
  const refreshData = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  return {
    marcas,
    unidades,
    marcasNomes,
    loading,
    getUnidadesByMarcaNome,
    getUnidadesComOrcamentoProprio,
    hasOrcamentoProprio,
    refreshData,
  };
};

// Export para uso em componentes que só precisam da lista de marcas
export const useMarcasOptions = () => {
  const { marcasNomes, loading } = useMarcasUnidadesData();
  return { marcas: marcasNomes, loading };
};
