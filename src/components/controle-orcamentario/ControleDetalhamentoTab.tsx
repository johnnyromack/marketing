import { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Search, Download } from 'lucide-react';
import { ControleRegistro } from '@/hooks/useControleOrcamentario';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ControleDetalhamentoTabProps {
  registros: ControleRegistro[];
  anoFiltro: number;
  marcaFiltro: string;
  onDelete: (id: string) => Promise<boolean>;
  onUpdateStatus: (id: string, status: string) => Promise<boolean>;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('pt-BR');
};

const STATUS_OPTIONS = [
  { value: 'recebido', label: 'Recebido', color: 'bg-blue-500' },
  { value: 'previsto', label: 'Previsto', color: 'bg-yellow-500' },
  { value: 'pago', label: 'Pago', color: 'bg-green-500' },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-gray-500' },
  { value: 'atrasado', label: 'Atrasado', color: 'bg-red-500' },
];

export const ControleDetalhamentoTab = ({
  registros,
  anoFiltro,
  marcaFiltro,
  onDelete,
  onUpdateStatus,
}: ControleDetalhamentoTabProps) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  const registrosFiltrados = useMemo(() => {
    return registros.filter((r) => {
      const matchAno = r.ano === anoFiltro;
      const matchMarca = marcaFiltro === 'todas' || r.marca === marcaFiltro;
      const matchStatus = statusFilter === 'todos' || r.status === statusFilter;
      const matchSearch =
        search === '' ||
        r.descricao.toLowerCase().includes(search.toLowerCase()) ||
        r.fornecedor?.toLowerCase().includes(search.toLowerCase()) ||
        r.tipo_custo.toLowerCase().includes(search.toLowerCase());

      return matchAno && matchMarca && matchStatus && matchSearch;
    });
  }, [registros, anoFiltro, marcaFiltro, statusFilter, search]);

  const getStatusBadge = (status: string) => {
    const statusInfo = STATUS_OPTIONS.find((s) => s.value === status);
    if (!statusInfo) return <Badge variant="outline">{status}</Badge>;

    return (
      <Badge className={cn('text-white', statusInfo.color)}>{statusInfo.label}</Badge>
    );
  };

  const exportToCSV = () => {
    const headers = [
      'Ano',
      'Mês',
      'Nº Chamado',
      'Fornecedor',
      'Descrição',
      'Marca',
      'Unidade',
      'Status',
      'Tipo Custo',
      'Valor',
      'Tipo Pagamento',
      'Nº Documento',
      'Data Solicitação',
      'Previsão Pagamento',
    ];

    const rows = registrosFiltrados.map((r) => [
      r.ano,
      r.mes,
      r.numero_chamado || '',
      r.fornecedor || '',
      r.descricao,
      r.marca,
      r.unidade || '',
      r.status,
      r.tipo_custo,
      r.valor,
      r.tipo_pagamento,
      r.numero_documento || '',
      r.data_solicitacao || '',
      r.previsao_pagamento || '',
    ]);

    const csvContent = [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `controle-orcamentario-${anoFiltro}.csv`;
    link.click();
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição, fornecedor ou tipo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mês</TableHead>
              <TableHead>Nº Chamado</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Tipo Custo</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Prev. Pgto</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registrosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                  Nenhum registro encontrado
                </TableCell>
              </TableRow>
            ) : (
              registrosFiltrados.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.mes}</TableCell>
                  <TableCell>{r.numero_chamado || '-'}</TableCell>
                  <TableCell>{r.fornecedor || '-'}</TableCell>
                  <TableCell className="max-w-48 truncate" title={r.descricao}>
                    {r.descricao}
                  </TableCell>
                  <TableCell>{r.marca}</TableCell>
                  <TableCell>{r.tipo_custo}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(Number(r.valor))}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={r.status}
                      onValueChange={(v) => onUpdateStatus(r.id, v)}
                    >
                      <SelectTrigger className="h-8 w-28 p-1">
                        {getStatusBadge(r.status)}
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{formatDate(r.previsao_pagamento)}</TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O registro será permanentemente
                            excluído.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(r.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground">
        Exibindo {registrosFiltrados.length} de {registros.length} registros
      </p>
    </div>
  );
};
