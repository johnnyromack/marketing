import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/ui/currency-input';
import { MONTHS, YEARS } from '@/components/midia/shared/constants';
import { TipoCusto } from '@/hooks/useControleOrcamentario';

const STATUS_OPTIONS = [
  { value: 'recebido', label: 'Recebido' },
  { value: 'previsto', label: 'Previsto' },
  { value: 'pago', label: 'Pago' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'atrasado', label: 'Atrasado' },
];

const TIPO_PAGAMENTO_OPTIONS = [
  { value: 'nota_fiscal', label: 'Nota Fiscal/Recibo' },
  { value: 'cartao_corporativo', label: 'Cartão Corporativo' },
  { value: 'fatura', label: 'Fatura' },
  { value: 'recibo', label: 'Recibo' },
];

interface ControleFormFieldsProps {
  form: UseFormReturn<any>;
  marcas: string[];
  unidades: string[];
  fornecedores: { id: string; nome: string }[];
  tiposCusto: TipoCusto[];
  onMarcaChange: (marca: string) => void;
}

export const ControleFormFields = ({
  form,
  marcas,
  unidades,
  fornecedores,
  tiposCusto,
  onMarcaChange,
}: ControleFormFieldsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {/* Ano */}
      <FormField
        control={form.control}
        name="ano"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Ano *</FormLabel>
            <Select
              value={String(field.value)}
              onValueChange={(v) => field.onChange(Number(v))}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Mês */}
      <FormField
        control={form.control}
        name="mes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Mês *</FormLabel>
            <Select
              value={field.value}
              onValueChange={(v) => {
                field.onChange(v);
                const month = MONTHS.find((m) => m.label === v);
                if (month) {
                  form.setValue('mes_numero', month.numero);
                }
              }}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.label}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Número do Chamado */}
      <FormField
        control={form.control}
        name="numero_chamado"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nº Chamado</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="Número do chamado"
                onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Fornecedor */}
      <FormField
        control={form.control}
        name="fornecedor"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Fornecedor</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {fornecedores.map((f) => (
                  <SelectItem key={f.id} value={f.nome}>
                    {f.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Descrição */}
      <FormField
        control={form.control}
        name="descricao"
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Descrição *</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Descrição do custo" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Marca */}
      <FormField
        control={form.control}
        name="marca"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Marca *</FormLabel>
            <Select
              value={field.value}
              onValueChange={(v) => {
                field.onChange(v);
                onMarcaChange(v);
              }}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {marcas.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Unidade */}
      <FormField
        control={form.control}
        name="unidade"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Unidade</FormLabel>
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={unidades.length === 0}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {unidades.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Status */}
      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Status *</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Tipo de Custo */}
      <FormField
        control={form.control}
        name="tipo_custo"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo de Custo *</FormLabel>
            <Select
              value={field.value}
              onValueChange={(v) => {
                field.onChange(v);
                const tipo = tiposCusto.find((t) => t.nome === v);
                if (tipo) {
                  form.setValue('tipo_custo_id', tipo.id);
                }
              }}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {tiposCusto.map((t) => (
                  <SelectItem key={t.id} value={t.nome}>
                    {t.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Valor */}
      <FormField
        control={form.control}
        name="valor"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Valor *</FormLabel>
            <FormControl>
              <CurrencyInput
                value={field.value}
                onChange={field.onChange}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Tipo de Pagamento */}
      <FormField
        control={form.control}
        name="tipo_pagamento"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo Pagamento *</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {TIPO_PAGAMENTO_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Número do Documento */}
      <FormField
        control={form.control}
        name="numero_documento"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nº Documento</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Número" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Data Solicitação */}
      <FormField
        control={form.control}
        name="data_solicitacao"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Data Solicitação</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Previsão Pagamento */}
      <FormField
        control={form.control}
        name="previsao_pagamento"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Previsão Pagamento</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Observações */}
      <FormField
        control={form.control}
        name="observacoes"
        render={({ field }) => (
          <FormItem className="md:col-span-2 lg:col-span-3 xl:col-span-4">
            <FormLabel>Observações</FormLabel>
            <FormControl>
              <Textarea {...field} placeholder="Observações adicionais" rows={2} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
