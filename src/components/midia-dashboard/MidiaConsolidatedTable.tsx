import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ConsolidatedRow {
  marca: string;
  mes: string;
  mes_numero: number;
  orcado: number;
  realizado: number;
  saldo: number;
  tipo: string;
}

interface MidiaConsolidatedTableProps {
  data: ConsolidatedRow[];
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
};

export const MidiaConsolidatedTable = ({ data }: MidiaConsolidatedTableProps) => {
  // Group by marca for totals
  const totals = data.reduce(
    (acc, row) => ({
      orcado: acc.orcado + row.orcado,
      realizado: acc.realizado + row.realizado,
      saldo: acc.saldo + row.saldo,
    }),
    { orcado: 0, realizado: 0, saldo: 0 }
  );

  const exportToCSV = () => {
    const headers = ['Marca', 'Mês', 'Orçado', 'Realizado', 'Saldo'];
    const rows = data.map(row => [
      row.marca,
      row.mes,
      row.orcado,
      row.realizado,
      row.saldo,
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
      '',
      ['TOTAL', '', totals.orcado, totals.realizado, totals.saldo].join(','),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'midia_consolidado.csv';
    link.click();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Tabela Consolidada</CardTitle>
        <Button variant="outline" size="sm" onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum dado encontrado para os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Marca</TableHead>
                  <TableHead>Mês</TableHead>
                  <TableHead className="text-right">Orçado</TableHead>
                  <TableHead className="text-right">Realizado</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-right">% Exec.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, index) => {
                  const percentExec = row.orcado > 0 ? (row.realizado / row.orcado) * 100 : 0;
                  return (
                    <TableRow key={`${row.marca}-${row.mes}-${index}`}>
                      <TableCell className="font-medium">{row.marca}</TableCell>
                      <TableCell>{row.mes}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.orcado)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.realizado)}</TableCell>
                      <TableCell className={`text-right font-medium ${row.saldo >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatCurrency(row.saldo)}
                      </TableCell>
                      <TableCell className="text-right">{percentExec.toFixed(1)}%</TableCell>
                    </TableRow>
                  );
                })}
                {/* Totals row */}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={2}>TOTAL</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.orcado)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.realizado)}</TableCell>
                  <TableCell className={`text-right ${totals.saldo >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(totals.saldo)}
                  </TableCell>
                  <TableCell className="text-right">
                    {totals.orcado > 0 ? ((totals.realizado / totals.orcado) * 100).toFixed(1) : 0}%
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
