import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Users, DollarSign, TrendingUp } from 'lucide-react';

interface EventData {
  marca: string;
  month: string;
  numEventos: number;
  investEventos: number;
  leadsEventos: number;
  cplEventos: number;
}

interface EventsSectionProps {
  data: EventData[];
}

export const EventsSection = ({ data }: EventsSectionProps) => {
  const totalEventos = data.reduce((sum, d) => sum + d.numEventos, 0);
  const totalInvest = data.reduce((sum, d) => sum + d.investEventos, 0);
  const totalLeads = data.reduce((sum, d) => sum + d.leadsEventos, 0);
  const avgCpl = totalLeads > 0 ? totalInvest / totalLeads : 0;

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  };

  // Filtrar apenas registros com eventos
  const eventsData = data.filter(d => d.numEventos > 0 || d.leadsEventos > 0 || d.investEventos > 0);

  if (eventsData.length === 0 && totalEventos === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Nenhum evento registrado no período selecionado.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPIs de Eventos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Eventos</p>
                <p className="text-2xl font-bold">{totalEventos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Investimento em Eventos</p>
                <p className="text-2xl font-bold">{formatCurrency(totalInvest)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Leads de Eventos</p>
                <p className="text-2xl font-bold">{totalLeads.toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CPL Eventos (Média)</p>
                <p className="text-2xl font-bold">{formatCurrency(avgCpl)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Eventos */}
      {eventsData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Detalhamento de Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Marca</TableHead>
                  <TableHead>Mês</TableHead>
                  <TableHead className="text-right">Nº Eventos</TableHead>
                  <TableHead className="text-right">Investimento</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">CPL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventsData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.marca}</TableCell>
                    <TableCell>{item.month}</TableCell>
                    <TableCell className="text-right">{item.numEventos}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.investEventos)}</TableCell>
                    <TableCell className="text-right">{item.leadsEventos.toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.cplEventos)}</TableCell>
                  </TableRow>
                ))}
                {/* Linha de Total */}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell colSpan={2}>TOTAL</TableCell>
                  <TableCell className="text-right">{totalEventos}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totalInvest)}</TableCell>
                  <TableCell className="text-right">{totalLeads.toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-right">{formatCurrency(avgCpl)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};