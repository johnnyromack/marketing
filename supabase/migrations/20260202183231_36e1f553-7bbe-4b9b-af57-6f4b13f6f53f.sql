-- Create RPC function for dashboard aggregated totals (publicidade)
CREATE OR REPLACE FUNCTION public.get_publicidade_totals(
  p_status text DEFAULT 'aprovado',
  p_marca text DEFAULT NULL,
  p_unidade text DEFAULT NULL,
  p_year_from int DEFAULT NULL,
  p_year_to int DEFAULT NULL,
  p_month_from int DEFAULT NULL,
  p_month_to int DEFAULT NULL
)
RETURNS TABLE (
  total_leads_real bigint,
  total_leads_orcado bigint,
  total_leads_a1 bigint,
  total_matriculas_real bigint,
  total_matriculas_orcado bigint,
  total_matriculas_a1 bigint,
  total_leads_prod_real bigint,
  total_leads_prod_orcado bigint,
  total_leads_prod_a1 bigint,
  avg_cac_real numeric,
  avg_cac_orcado numeric,
  avg_cac_a1 numeric,
  avg_cpl_real numeric,
  avg_cpl_orcado numeric,
  avg_cpl_a1 numeric,
  avg_cpl_prod_real numeric,
  avg_cpl_prod_orcado numeric,
  avg_cpl_prod_a1 numeric,
  total_invest_meta numeric,
  total_invest_google numeric,
  total_invest_off numeric,
  total_invest_eventos numeric,
  total_invest numeric,
  row_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(SUM(leads_real), 0)::bigint as total_leads_real,
    COALESCE(SUM(leads_orcado), 0)::bigint as total_leads_orcado,
    COALESCE(SUM(leads_a1), 0)::bigint as total_leads_a1,
    COALESCE(SUM(matriculas_real), 0)::bigint as total_matriculas_real,
    COALESCE(SUM(matriculas_orcado), 0)::bigint as total_matriculas_orcado,
    COALESCE(SUM(matriculas_a1), 0)::bigint as total_matriculas_a1,
    COALESCE(SUM(leads_prod_real), 0)::bigint as total_leads_prod_real,
    COALESCE(SUM(leads_prod_orcado), 0)::bigint as total_leads_prod_orcado,
    COALESCE(SUM(leads_prod_a1), 0)::bigint as total_leads_prod_a1,
    COALESCE(AVG(cac_real), 0)::numeric as avg_cac_real,
    COALESCE(AVG(cac_orcado), 0)::numeric as avg_cac_orcado,
    COALESCE(AVG(cac_a1), 0)::numeric as avg_cac_a1,
    COALESCE(AVG(cpl_real), 0)::numeric as avg_cpl_real,
    COALESCE(AVG(cpl_orcado), 0)::numeric as avg_cpl_orcado,
    COALESCE(AVG(cpl_a1), 0)::numeric as avg_cpl_a1,
    COALESCE(AVG(cpl_prod_real), 0)::numeric as avg_cpl_prod_real,
    COALESCE(AVG(cpl_prod_orcado), 0)::numeric as avg_cpl_prod_orcado,
    COALESCE(AVG(cpl_prod_a1), 0)::numeric as avg_cpl_prod_a1,
    COALESCE(SUM(invest_meta), 0)::numeric as total_invest_meta,
    COALESCE(SUM(invest_google), 0)::numeric as total_invest_google,
    COALESCE(SUM(invest_off), 0)::numeric as total_invest_off,
    COALESCE(SUM(invest_eventos), 0)::numeric as total_invest_eventos,
    COALESCE(SUM(invest_meta + invest_google + invest_off + invest_eventos), 0)::numeric as total_invest,
    COUNT(*)::bigint as row_count
  FROM public.publicidade_dados
  WHERE status = p_status
    AND (p_marca IS NULL OR marca = p_marca)
    AND (p_unidade IS NULL OR unidade = p_unidade)
    AND (p_year_from IS NULL OR year >= p_year_from)
    AND (p_year_to IS NULL OR year <= p_year_to)
    AND (p_month_from IS NULL OR month_number >= p_month_from)
    AND (p_month_to IS NULL OR month_number <= p_month_to);
$$;

-- Create RPC function to get all approved publicidade data without row limit
CREATE OR REPLACE FUNCTION public.get_all_publicidade_dados(
  p_status text DEFAULT 'aprovado'
)
RETURNS SETOF public.publicidade_dados
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.publicidade_dados
  WHERE status = p_status
  ORDER BY year, month_number;
$$;

-- Create RPC function for midia totals
CREATE OR REPLACE FUNCTION public.get_midia_totals(
  p_ano int DEFAULT NULL
)
RETURNS TABLE (
  tipo text,
  total_orcado numeric,
  total_realizado numeric,
  total_saving numeric,
  row_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    'midia_on' as tipo,
    COALESCE(SUM(orcamento_on), 0)::numeric as total_orcado,
    COALESCE(SUM(valor_realizado), 0)::numeric as total_realizado,
    COALESCE(SUM(orcamento_on - valor_realizado), 0)::numeric as total_saving,
    COUNT(*)::bigint as row_count
  FROM public.midia_on
  WHERE (p_ano IS NULL OR ano = p_ano)
  
  UNION ALL
  
  SELECT 
    'midia_off' as tipo,
    COALESCE(SUM(orcamento_off), 0)::numeric as total_orcado,
    COALESCE(SUM(valor_realizado), 0)::numeric as total_realizado,
    COALESCE(SUM(saving_midia + saving_producao), 0)::numeric as total_saving,
    COUNT(*)::bigint as row_count
  FROM public.midia_off
  WHERE (p_ano IS NULL OR ano = p_ano)
  
  UNION ALL
  
  SELECT 
    'eventos' as tipo,
    COALESCE(SUM(orcamento_evento), 0)::numeric as total_orcado,
    COALESCE(SUM(ec.valor_realizado), 0)::numeric as total_realizado,
    COALESCE(SUM(orcamento_evento) - SUM(ec.valor_realizado), 0)::numeric as total_saving,
    COUNT(DISTINCT e.id)::bigint as row_count
  FROM public.eventos e
  LEFT JOIN public.evento_custos ec ON ec.evento_id = e.id
  WHERE (p_ano IS NULL OR e.ano = p_ano)
  
  UNION ALL
  
  SELECT 
    'brindes' as tipo,
    COALESCE(SUM(valor_orcado), 0)::numeric as total_orcado,
    COALESCE(SUM(valor_realizado), 0)::numeric as total_realizado,
    COALESCE(SUM(valor_orcado - valor_realizado), 0)::numeric as total_saving,
    COUNT(*)::bigint as row_count
  FROM public.brindes
  WHERE (p_ano IS NULL OR ano = p_ano);
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_publicidade_totals TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_publicidade_dados TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_midia_totals TO authenticated;