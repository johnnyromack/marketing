-- Limpar dados de teste de orçamentos
DELETE FROM orcamentos;

-- Criar tabela de campanhas (registro mestre)
CREATE TABLE public.campanhas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  marca TEXT NOT NULL,
  unidade TEXT DEFAULT NULL,
  orcamento_total NUMERIC NOT NULL DEFAULT 0,
  mes_inicio INTEGER NOT NULL,
  ano_inicio INTEGER NOT NULL,
  mes_fim INTEGER NOT NULL,
  ano_fim INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'rascunho',
  observacoes TEXT DEFAULT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de distribuição por tipo de mídia
CREATE TABLE public.campanha_midia_distribuicao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campanha_id UUID NOT NULL REFERENCES public.campanhas(id) ON DELETE CASCADE,
  tipo_midia TEXT NOT NULL, -- midia_on, midia_off, eventos, brindes
  valor_alocado NUMERIC NOT NULL DEFAULT 0,
  observacoes TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campanha_id, tipo_midia)
);

-- Criar tabela de distribuição mensal (opcional por tipo de mídia)
CREATE TABLE public.campanha_mensal_distribuicao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  distribuicao_id UUID NOT NULL REFERENCES public.campanha_midia_distribuicao(id) ON DELETE CASCADE,
  mes INTEGER NOT NULL,
  ano INTEGER NOT NULL,
  valor_alocado NUMERIC NOT NULL DEFAULT 0,
  verba_extra NUMERIC NOT NULL DEFAULT 0,
  observacoes TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(distribuicao_id, mes, ano)
);

-- Enable RLS
ALTER TABLE public.campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanha_midia_distribuicao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanha_mensal_distribuicao ENABLE ROW LEVEL SECURITY;

-- Políticas para campanhas
CREATE POLICY "Users can insert their own campanhas" ON public.campanhas 
FOR INSERT WITH CHECK (auth.uid() = user_id AND has_any_role(auth.uid(), ARRAY['admin', 'gestor', 'editor']::app_role[]));

CREATE POLICY "Users can view their own campanhas" ON public.campanhas 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own draft campanhas" ON public.campanhas 
FOR UPDATE USING (auth.uid() = user_id AND status IN ('rascunho', 'pendente'));

CREATE POLICY "Users can delete their own campanhas" ON public.campanhas 
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all campanhas" ON public.campanhas 
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update any campanhas" ON public.campanhas 
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete any campanhas" ON public.campanhas 
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Gestors can view pending campanhas" ON public.campanhas 
FOR SELECT USING (
  status = 'pendente' AND 
  has_role(auth.uid(), 'gestor'::app_role) AND 
  EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = campanhas.user_id AND user_roles.gestor_id = auth.uid())
);

CREATE POLICY "Gestors can approve campanhas" ON public.campanhas 
FOR UPDATE USING (
  status = 'pendente' AND 
  has_role(auth.uid(), 'gestor'::app_role) AND 
  EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = campanhas.user_id AND user_roles.gestor_id = auth.uid())
);

CREATE POLICY "Leitores can view approved campanhas" ON public.campanhas 
FOR SELECT USING (status = 'aprovado' AND has_role(auth.uid(), 'leitor'::app_role));

CREATE POLICY "Users can view approved campanhas" ON public.campanhas 
FOR SELECT USING (status = 'aprovado');

-- Políticas para distribuição de mídia (baseadas na campanha pai)
CREATE POLICY "Users can manage their campanha midia" ON public.campanha_midia_distribuicao 
FOR ALL USING (EXISTS (SELECT 1 FROM campanhas WHERE campanhas.id = campanha_midia_distribuicao.campanha_id AND campanhas.user_id = auth.uid()));

CREATE POLICY "Admins can manage all campanha midia" ON public.campanha_midia_distribuicao 
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view approved campanha midia" ON public.campanha_midia_distribuicao 
FOR SELECT USING (EXISTS (SELECT 1 FROM campanhas WHERE campanhas.id = campanha_midia_distribuicao.campanha_id AND campanhas.status = 'aprovado'));

-- Políticas para distribuição mensal (baseadas na distribuição pai)
CREATE POLICY "Users can manage their mensal distribuicao" ON public.campanha_mensal_distribuicao 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM campanha_midia_distribuicao cmd 
    JOIN campanhas c ON c.id = cmd.campanha_id 
    WHERE cmd.id = campanha_mensal_distribuicao.distribuicao_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all mensal distribuicao" ON public.campanha_mensal_distribuicao 
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view approved mensal distribuicao" ON public.campanha_mensal_distribuicao 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM campanha_midia_distribuicao cmd 
    JOIN campanhas c ON c.id = cmd.campanha_id 
    WHERE cmd.id = campanha_mensal_distribuicao.distribuicao_id AND c.status = 'aprovado'
  )
);

-- Triggers for updated_at
CREATE TRIGGER update_campanhas_updated_at BEFORE UPDATE ON public.campanhas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campanha_midia_distribuicao_updated_at BEFORE UPDATE ON public.campanha_midia_distribuicao
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campanha_mensal_distribuicao_updated_at BEFORE UPDATE ON public.campanha_mensal_distribuicao
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();