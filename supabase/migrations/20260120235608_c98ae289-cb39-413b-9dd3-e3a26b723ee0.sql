-- Adicionar campo tipo_orcamento à tabela tipos_custo
-- Valores possíveis: 'proprio' ou 'compartilhado'
ALTER TABLE public.tipos_custo 
ADD COLUMN tipo_orcamento TEXT NOT NULL DEFAULT 'proprio' 
CHECK (tipo_orcamento IN ('proprio', 'compartilhado'));