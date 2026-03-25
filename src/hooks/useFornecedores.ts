import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type Fornecedor = Tables<'fornecedores'>;

export const useFornecedores = (tipo?: string) => {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFornecedores = async () => {
      setIsLoading(true);
      let query = supabase
        .from('fornecedores')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (tipo) {
        query = query.eq('tipo', tipo);
      }

      const { data, error } = await query;
      if (!error && data) {
        setFornecedores(data);
      }
      setIsLoading(false);
    };

    fetchFornecedores();
  }, [tipo]);

  return { fornecedores, isLoading };
};
