-- Criar tabela de tipos de custo
CREATE TABLE public.tipos_custo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tipos_custo ENABLE ROW LEVEL SECURITY;

-- Policies for tipos_custo
CREATE POLICY "Authenticated users can view tipos_custo"
ON public.tipos_custo FOR SELECT
USING (true);

CREATE POLICY "Admins and editors can insert tipos_custo"
ON public.tipos_custo FOR INSERT
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'editor'::app_role]));

CREATE POLICY "Admins and editors can update tipos_custo"
ON public.tipos_custo FOR UPDATE
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'editor'::app_role]));

CREATE POLICY "Admins can delete tipos_custo"
ON public.tipos_custo FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Criar tabela de controle orçamentário
CREATE TABLE public.controle_orcamentario (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ano INTEGER NOT NULL,
  mes TEXT NOT NULL,
  mes_numero INTEGER NOT NULL,
  numero_chamado TEXT,
  fornecedor TEXT,
  descricao TEXT NOT NULL,
  marca TEXT NOT NULL,
  unidade TEXT DEFAULT 'Geral',
  status TEXT NOT NULL DEFAULT 'previsto',
  tipo_custo_id UUID REFERENCES public.tipos_custo(id),
  tipo_custo TEXT NOT NULL,
  valor NUMERIC NOT NULL DEFAULT 0,
  tipo_pagamento TEXT NOT NULL DEFAULT 'nota_fiscal',
  numero_documento TEXT,
  solicitante TEXT,
  data_solicitacao DATE,
  previsao_pagamento DATE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.controle_orcamentario ENABLE ROW LEVEL SECURITY;

-- Policies for controle_orcamentario
CREATE POLICY "Admins can view all controle_orcamentario"
ON public.controle_orcamentario FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own controle_orcamentario"
ON public.controle_orcamentario FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Gestors can view subordinates controle_orcamentario"
ON public.controle_orcamentario FOR SELECT
USING (has_role(auth.uid(), 'gestor'::app_role) AND EXISTS (
  SELECT 1 FROM user_roles WHERE user_roles.user_id = controle_orcamentario.user_id AND user_roles.gestor_id = auth.uid()
));

CREATE POLICY "Leitores can view approved controle_orcamentario"
ON public.controle_orcamentario FOR SELECT
USING (status = 'aprovado' AND has_role(auth.uid(), 'leitor'::app_role));

CREATE POLICY "Users can insert their own controle_orcamentario"
ON public.controle_orcamentario FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own controle_orcamentario"
ON public.controle_orcamentario FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any controle_orcamentario"
ON public.controle_orcamentario FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete their own controle_orcamentario"
ON public.controle_orcamentario FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any controle_orcamentario"
ON public.controle_orcamentario FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_controle_orcamentario_updated_at
BEFORE UPDATE ON public.controle_orcamentario
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tipos_custo_updated_at
BEFORE UPDATE ON public.tipos_custo
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default tipos de custo
INSERT INTO public.tipos_custo (nome, descricao) VALUES
('Agência', 'Custos com agências de publicidade e marketing'),
('Consultoria', 'Serviços de consultoria'),
('Tecnologia', 'Sistemas, softwares e infraestrutura'),
('Viagens', 'Despesas com viagens e deslocamentos'),
('Treinamento', 'Capacitação e desenvolvimento'),
('Material', 'Materiais diversos'),
('Outros', 'Outros custos não categorizados');