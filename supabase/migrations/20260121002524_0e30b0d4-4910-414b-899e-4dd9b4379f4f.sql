-- Create table for monthly distribution of area budgets
CREATE TABLE public.orcamento_area_distribuicao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL,
  valor_orcado NUMERIC NOT NULL DEFAULT 0,
  verba_extra NUMERIC NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(orcamento_id, mes, ano)
);

-- Enable RLS
ALTER TABLE public.orcamento_area_distribuicao ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their orcamento_area_distribuicao"
ON public.orcamento_area_distribuicao
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orcamentos o
    WHERE o.id = orcamento_id AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all orcamento_area_distribuicao"
ON public.orcamento_area_distribuicao
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert their orcamento_area_distribuicao"
ON public.orcamento_area_distribuicao
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orcamentos o
    WHERE o.id = orcamento_id AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can insert any orcamento_area_distribuicao"
ON public.orcamento_area_distribuicao
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update their orcamento_area_distribuicao"
ON public.orcamento_area_distribuicao
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM orcamentos o
    WHERE o.id = orcamento_id AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can update any orcamento_area_distribuicao"
ON public.orcamento_area_distribuicao
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete their orcamento_area_distribuicao"
ON public.orcamento_area_distribuicao
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM orcamentos o
    WHERE o.id = orcamento_id AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can delete any orcamento_area_distribuicao"
ON public.orcamento_area_distribuicao
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_orcamento_area_distribuicao_updated_at
BEFORE UPDATE ON public.orcamento_area_distribuicao
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();