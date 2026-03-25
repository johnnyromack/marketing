import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Save, Loader2 } from 'lucide-react';
import { ControleFormFields } from './ControleFormFields';
import { OrcamentoAreaIndicator } from './OrcamentoAreaIndicator';
import { TipoCusto, ControleFormData } from '@/hooks/useControleOrcamentario';

const formSchema = z.object({
  ano: z.number().min(2020).max(2031),
  mes: z.string().min(1, 'Mês é obrigatório'),
  mes_numero: z.number().min(1).max(12),
  numero_chamado: z.string().optional(),
  fornecedor: z.string().optional(),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  marca: z.string().min(1, 'Marca é obrigatória'),
  unidade: z.string().optional(),
  status: z.string().min(1, 'Status é obrigatório'),
  tipo_custo_id: z.string().optional(),
  tipo_custo: z.string().min(1, 'Tipo de custo é obrigatório'),
  valor: z.number().min(0.01, 'Valor deve ser maior que zero'),
  tipo_pagamento: z.string().min(1, 'Tipo de pagamento é obrigatório'),
  numero_documento: z.string().optional(),
  solicitante: z.string().optional(),
  data_solicitacao: z.string().optional(),
  previsao_pagamento: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ControleSingleFormProps {
  marcas: string[];
  getUnidadesByMarca: (marca: string) => string[];
  fornecedores: { id: string; nome: string }[];
  tiposCusto: TipoCusto[];
  solicitante: string;
  onSave: (registro: ControleFormData) => Promise<boolean>;
}

export const ControleSingleForm = ({
  marcas,
  getUnidadesByMarca,
  fornecedores,
  tiposCusto,
  solicitante,
  onSave,
}: ControleSingleFormProps) => {
  const [saving, setSaving] = useState(false);
  const [unidades, setUnidades] = useState<string[]>(['Geral']);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ano: new Date().getFullYear(),
      mes: '',
      mes_numero: 1,
      numero_chamado: '',
      fornecedor: '',
      descricao: '',
      marca: '',
      unidade: '',
      status: 'previsto',
      tipo_custo_id: '',
      tipo_custo: '',
      valor: 0,
      tipo_pagamento: 'nota_fiscal',
      numero_documento: '',
      solicitante,
      data_solicitacao: '',
      previsao_pagamento: '',
      observacoes: '',
    },
  });

  const handleMarcaChange = (marca: string) => {
    setUnidades(getUnidadesByMarca(marca));
    form.setValue('unidade', '');
  };

  const onSubmit = async (data: FormValues) => {
    setSaving(true);

    const registro: ControleFormData = {
      ano: data.ano,
      mes: data.mes,
      mes_numero: data.mes_numero,
      descricao: data.descricao,
      marca: data.marca,
      status: data.status,
      tipo_custo: data.tipo_custo,
      valor: data.valor,
      tipo_pagamento: data.tipo_pagamento,
      numero_chamado: data.numero_chamado,
      fornecedor: data.fornecedor,
      unidade: data.unidade,
      tipo_custo_id: data.tipo_custo_id,
      numero_documento: data.numero_documento,
      data_solicitacao: data.data_solicitacao,
      previsao_pagamento: data.previsao_pagamento,
      observacoes: data.observacoes,
      solicitante,
    };

    const success = await onSave(registro);

    if (success) {
      form.reset();
      setUnidades(['Geral']);
    }

    setSaving(false);
  };

  const watchedMarca = form.watch('marca');
  const watchedTipoCusto = form.watch('tipo_custo');
  const watchedTipoCustoId = form.watch('tipo_custo_id');
  const watchedValor = form.watch('valor');
  const watchedAno = form.watch('ano');

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <ControleFormFields
              form={form}
              marcas={marcas}
              unidades={unidades}
              fornecedores={fornecedores}
              tiposCusto={tiposCusto}
              onMarcaChange={handleMarcaChange}
            />

            {watchedMarca && watchedTipoCusto && (
              <OrcamentoAreaIndicator
                tipoCustoId={watchedTipoCustoId}
                tipoCustoNome={watchedTipoCusto}
                marca={watchedMarca}
                ano={watchedAno}
                valorAtual={watchedValor}
              />
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Registro
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
