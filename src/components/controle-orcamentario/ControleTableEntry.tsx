import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Save, AlertTriangle, CheckCircle } from 'lucide-react';
import { CurrencyInput } from '@/components/ui/currency-input';
import { MONTHS, YEARS } from '@/components/midia/shared/constants';
import { TipoCusto, ControleFormData } from '@/hooks/useControleOrcamentario';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TableRowData {
  id: string;
  ano: number;
  mes: string;
  mes_numero: number;
  numero_chamado: string;
  fornecedor: string;
  descricao: string;
  marca: string;
  unidade: string;
  status: string;
  tipo_custo: string;
  valor: number;
  tipo_pagamento: string;
  numero_documento: string;
  data_solicitacao: string;
  previsao_pagamento: string;
}

interface OrcamentoAreaInfo {
  tipo_custo: string;
  marca: string;
  ano: number;
  valor_orcado: number;
  valor_utilizado: number;
  saldo_disponivel: number;
}

interface ControleTableEntryProps {
  marcas: string[];
  getUnidadesByMarca: (marca: string) => string[];
  fornecedores: { id: string; nome: string }[];
  tiposCusto: TipoCusto[];
  solicitante: string;
  onSave: (registros: ControleFormData[]) => Promise<boolean>;
  orcamentosArea?: OrcamentoAreaInfo[];
}

const STATUS_OPTIONS = [
  { value: 'recebido', label: 'Recebido', color: 'bg-blue-500' },
  { value: 'previsto', label: 'Previsto', color: 'bg-yellow-500' },
  { value: 'pago', label: 'Pago', color: 'bg-green-500' },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-gray-500' },
  { value: 'atrasado', label: 'Atrasado', color: 'bg-red-500' },
];

const TIPO_PAGAMENTO_OPTIONS = [
  { value: 'nota_fiscal', label: 'NF/Recibo' },
  { value: 'cartao_corporativo', label: 'Cartão Corp.' },
  { value: 'fatura', label: 'Fatura' },
  { value: 'recibo', label: 'Recibo' },
];

const createEmptyRow = (): TableRowData => ({
  id: crypto.randomUUID(),
  ano: new Date().getFullYear(),
  mes: '',
  mes_numero: 0,
  numero_chamado: '',
  fornecedor: '',
  descricao: '',
  marca: '',
  unidade: '',
  status: 'previsto',
  tipo_custo: '',
  valor: 0,
  tipo_pagamento: 'nota_fiscal',
  numero_documento: '',
  data_solicitacao: '',
  previsao_pagamento: '',
});

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const ControleTableEntry = ({
  marcas,
  getUnidadesByMarca,
  fornecedores,
  tiposCusto,
  solicitante,
  onSave,
  orcamentosArea = [],
}: ControleTableEntryProps) => {
  const [rows, setRows] = useState<TableRowData[]>([createEmptyRow()]);
  const [saving, setSaving] = useState(false);

  const getSaldoInfo = useMemo(() => {
    return (tipoCusto: string, marca: string, ano: number, valorLinha: number) => {
      const orcamento = orcamentosArea.find(
        (o) => o.tipo_custo === tipoCusto && o.marca === marca && o.ano === ano
      );

      if (!orcamento) return null;

      const valorOutrasLinhas =
        rows
          .filter((r) => r.tipo_custo === tipoCusto && r.marca === marca && r.ano === ano)
          .reduce((sum, r) => sum + (r.valor || 0), 0) - valorLinha;

      const novoUtilizado = orcamento.valor_utilizado + valorOutrasLinhas + valorLinha;
      const novoSaldo = orcamento.valor_orcado - novoUtilizado;

      return {
        valor_orcado: orcamento.valor_orcado,
        valor_utilizado: novoUtilizado,
        saldo_disponivel: novoSaldo,
      };
    };
  }, [orcamentosArea, rows]);

  const updateRow = (id: string, field: keyof TableRowData, value: any) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;

        const updated = { ...row, [field]: value };

        if (field === 'mes') {
          const month = MONTHS.find((m) => m.label === value);
          if (month) updated.mes_numero = month.numero;
        }

        if (field === 'marca') {
          updated.unidade = '';
        }

        return updated;
      })
    );
  };

  const addRow = () => {
    setRows((prev) => [...prev, createEmptyRow()]);
  };

  const removeRow = (id: string) => {
    if (rows.length === 1) return;
    setRows((prev) => prev.filter((row) => row.id !== id));
  };

  const handleSave = async () => {
    const validRows = rows.filter(
      (row) => row.mes && row.descricao && row.marca && row.tipo_custo && row.valor > 0
    );

    if (validRows.length === 0) return;

    setSaving(true);

    const registros: ControleFormData[] = validRows.map((row) => ({
      ano: row.ano,
      mes: row.mes,
      mes_numero: row.mes_numero,
      numero_chamado: row.numero_chamado || undefined,
      fornecedor: row.fornecedor || undefined,
      descricao: row.descricao,
      marca: row.marca,
      unidade: row.unidade || undefined,
      status: row.status,
      tipo_custo: row.tipo_custo,
      valor: row.valor,
      tipo_pagamento: row.tipo_pagamento,
      numero_documento: row.numero_documento || undefined,
      solicitante,
      data_solicitacao: row.data_solicitacao || undefined,
      previsao_pagamento: row.previsao_pagamento || undefined,
    }));

    const success = await onSave(registros);

    if (success) {
      setRows([createEmptyRow()]);
    }

    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Ano</TableHead>
              <TableHead className="w-28">Mês</TableHead>
              <TableHead className="w-24">Nº Chamado</TableHead>
              <TableHead className="w-36">Fornecedor</TableHead>
              <TableHead className="min-w-48">Descrição</TableHead>
              <TableHead className="w-32">Marca</TableHead>
              <TableHead className="w-32">Unidade</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-40">Tipo Custo</TableHead>
              <TableHead className="w-32">Valor</TableHead>
              <TableHead className="w-20">Saldo</TableHead>
              <TableHead className="w-28">Tipo Pgto</TableHead>
              <TableHead className="w-24">Nº Doc</TableHead>
              <TableHead className="w-28">Data Solic.</TableHead>
              <TableHead className="w-28">Prev. Pgto</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="p-1">
                  <Select
                    value={String(row.ano)}
                    onValueChange={(v) => updateRow(row.id, 'ano', Number(v))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="p-1">
                  <Select value={row.mes} onValueChange={(v) => updateRow(row.id, 'mes', v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem key={m.value} value={m.label}>
                          {m.label.slice(0, 3)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="p-1">
                  <Input
                    value={row.numero_chamado}
                    onChange={(e) =>
                      updateRow(row.id, 'numero_chamado', e.target.value.replace(/\D/g, ''))
                    }
                    className="h-8 text-xs"
                    placeholder="Nº"
                  />
                </TableCell>
                <TableCell className="p-1">
                  <Select
                    value={row.fornecedor}
                    onValueChange={(v) => updateRow(row.id, 'fornecedor', v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Fornec." />
                    </SelectTrigger>
                    <SelectContent>
                      {fornecedores.map((f) => (
                        <SelectItem key={f.id} value={f.nome}>
                          {f.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="p-1">
                  <Input
                    value={row.descricao}
                    onChange={(e) => updateRow(row.id, 'descricao', e.target.value)}
                    className="h-8 text-xs"
                    placeholder="Descrição *"
                  />
                </TableCell>
                <TableCell className="p-1">
                  <Select value={row.marca} onValueChange={(v) => updateRow(row.id, 'marca', v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Marca *" />
                    </SelectTrigger>
                    <SelectContent>
                      {marcas.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="p-1">
                  <Select
                    value={row.unidade}
                    onValueChange={(v) => updateRow(row.id, 'unidade', v)}
                    disabled={!row.marca}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Unid." />
                    </SelectTrigger>
                    <SelectContent>
                      {getUnidadesByMarca(row.marca).map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="p-1">
                  <Select value={row.status} onValueChange={(v) => updateRow(row.id, 'status', v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          <div className="flex items-center gap-1">
                            <div className={cn('w-2 h-2 rounded-full', s.color)} />
                            {s.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="p-1">
                  <Select
                    value={row.tipo_custo}
                    onValueChange={(v) => updateRow(row.id, 'tipo_custo', v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Tipo *" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposCusto.map((t) => (
                        <SelectItem key={t.id} value={t.nome}>
                          {t.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="p-1">
                  <CurrencyInput
                    value={row.valor}
                    onChange={(v) => updateRow(row.id, 'valor', v)}
                    className="h-8 text-xs"
                  />
                </TableCell>
                <TableCell className="p-1">
                  <TooltipProvider>
                    {row.tipo_custo && row.marca ? (
                      (() => {
                        const saldoInfo = getSaldoInfo(row.tipo_custo, row.marca, row.ano, row.valor);
                        if (!saldoInfo) {
                          return <span className="text-xs text-muted-foreground">-</span>;
                        }
                        const isNegative = saldoInfo.saldo_disponivel < 0;
                        const isLow =
                          saldoInfo.saldo_disponivel > 0 &&
                          saldoInfo.saldo_disponivel < saldoInfo.valor_orcado * 0.1;

                        return (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  'flex items-center gap-1 text-xs cursor-help',
                                  isNegative
                                    ? 'text-destructive'
                                    : isLow
                                    ? 'text-orange-500'
                                    : 'text-green-600'
                                )}
                              >
                                {isNegative ? (
                                  <AlertTriangle className="h-3 w-3" />
                                ) : (
                                  <CheckCircle className="h-3 w-3" />
                                )}
                                <span className="truncate w-16">
                                  {formatCurrency(saldoInfo.saldo_disponivel)}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="text-xs">
                              <div className="space-y-1">
                                <div>Orçado: {formatCurrency(saldoInfo.valor_orcado)}</div>
                                <div>Utilizado: {formatCurrency(saldoInfo.valor_utilizado)}</div>
                                <div
                                  className={
                                    isNegative
                                      ? 'text-destructive font-medium'
                                      : 'text-green-600 font-medium'
                                  }
                                >
                                  Saldo: {formatCurrency(saldoInfo.saldo_disponivel)}
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })()
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TooltipProvider>
                </TableCell>
                <TableCell className="p-1">
                  <Select
                    value={row.tipo_pagamento}
                    onValueChange={(v) => updateRow(row.id, 'tipo_pagamento', v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPO_PAGAMENTO_OPTIONS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="p-1">
                  <Input
                    value={row.numero_documento}
                    onChange={(e) => updateRow(row.id, 'numero_documento', e.target.value)}
                    className="h-8 text-xs"
                    placeholder="Nº"
                  />
                </TableCell>
                <TableCell className="p-1">
                  <Input
                    type="date"
                    value={row.data_solicitacao}
                    onChange={(e) => updateRow(row.id, 'data_solicitacao', e.target.value)}
                    className="h-8 text-xs"
                  />
                </TableCell>
                <TableCell className="p-1">
                  <Input
                    type="date"
                    value={row.previsao_pagamento}
                    onChange={(e) => updateRow(row.id, 'previsao_pagamento', e.target.value)}
                    className="h-8 text-xs"
                  />
                </TableCell>
                <TableCell className="p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={addRow}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Linha
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : `Salvar ${rows.length} Registro(s)`}
        </Button>
      </div>
    </div>
  );
};
