import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MonthData, formatCurrency } from "@/lib/mediaCalculations";

interface MonthlyDistributionTableProps {
  data: MonthData[];
}

export function MonthlyDistributionTable({
  data,
}: MonthlyDistributionTableProps) {
  const totals = data.reduce(
    (acc, item) => ({
      percentage: acc.percentage + item.percentage,
      enrollments: acc.enrollments + item.enrollments,
      leads: acc.leads + item.leads,
      budget: acc.budget + item.budget,
    }),
    { percentage: 0, enrollments: 0, leads: 0, budget: 0 }
  );

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Mês</TableHead>
            <TableHead className="text-right font-semibold">Curva %</TableHead>
            <TableHead className="text-right font-semibold">
              Matrículas
            </TableHead>
            <TableHead className="text-right font-semibold">Leads</TableHead>
            <TableHead className="text-right font-semibold">Verba</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.month}>
              <TableCell className="font-medium">{item.month}</TableCell>
              <TableCell className="text-right">
                {item.percentage.toFixed(1)}%
              </TableCell>
              <TableCell className="text-right">
                {item.enrollments.toLocaleString("pt-BR")}
              </TableCell>
              <TableCell className="text-right">
                {item.leads.toLocaleString("pt-BR")}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(item.budget)}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="bg-muted/50 font-bold">
            <TableCell>TOTAL</TableCell>
            <TableCell className="text-right">
              {totals.percentage.toFixed(1)}%
            </TableCell>
            <TableCell className="text-right">
              {totals.enrollments.toLocaleString("pt-BR")}
            </TableCell>
            <TableCell className="text-right">
              {totals.leads.toLocaleString("pt-BR")}
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(totals.budget)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
