import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BrandData } from '@/types/publicidade';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PerformanceTableProps {
  data: BrandData[];
}

const VariationCell = ({ value, orcado, isCost = false }: { value: number; orcado: number; isCost?: boolean }) => {
  const variation = ((value - orcado) / orcado) * 100;
  const isPositive = isCost ? variation < 0 : variation > 0;

  return (
    <div className="flex items-center gap-1">
      <span>{value.toLocaleString('pt-BR')}</span>
      <span className={cn(
        'text-xs flex items-center',
        isPositive ? 'text-success' : 'text-destructive'
      )}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {Math.abs(variation).toFixed(0)}%
      </span>
    </div>
  );
};

export const PerformanceTable = ({ data }: PerformanceTableProps) => {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Performance por Marca</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Marca</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">CAC (R$)</TableHead>
                <TableHead className="text-right">CPL (R$)</TableHead>
                <TableHead className="text-right">CPL Prod (R$)</TableHead>
                <TableHead className="text-right">Investimento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((brand) => {
                const totalInvest = brand.investMeta + brand.investGoogle + brand.investOff + brand.investEventos;
                return (
                  <TableRow key={brand.marca} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{brand.marca}</TableCell>
                    <TableCell className="text-right">
                      <VariationCell value={brand.leadsReal} orcado={brand.leadsOrcado} />
                    </TableCell>
                    <TableCell className="text-right">
                      <VariationCell value={brand.cacReal} orcado={brand.cacOrcado} isCost />
                    </TableCell>
                    <TableCell className="text-right">
                      <VariationCell value={brand.cplReal} orcado={brand.cplOrcado} isCost />
                    </TableCell>
                    <TableCell className="text-right">
                      <VariationCell value={brand.cplProdReal} orcado={brand.cplProdOrcado} isCost />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      R$ {totalInvest.toLocaleString('pt-BR')}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
