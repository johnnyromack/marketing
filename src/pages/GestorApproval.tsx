import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useActivityLog } from '@/hooks/useActivityLog';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, ClipboardCheck } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { formatCurrency } from '@/components/midia/shared/formatters';

type PublicidadeDados = Tables<'publicidade_dados'>;
type MidiaOn = Tables<'midia_on'>;
type MidiaOff = Tables<'midia_off'>;
type Evento = Tables<'eventos'>;
type Brinde = Tables<'brindes'>;
type Orcamento = {
  id: string;
  ano: number;
  mes_numero: number;
  mes: string;
  marca: string;
  unidade: string | null;
  tipo: string;
  valor_orcado: number;
  verba_extra: number;
  status: string;
};

const GestorApproval = () => {
  const [pendingPerformance, setPendingPerformance] = useState<PublicidadeDados[]>([]);
  const [pendingMidiaOn, setPendingMidiaOn] = useState<MidiaOn[]>([]);
  const [pendingMidiaOff, setPendingMidiaOff] = useState<MidiaOff[]>([]);
  const [pendingEventos, setPendingEventos] = useState<Evento[]>([]);
  const [pendingBrindes, setPendingBrindes] = useState<Brinde[]>([]);
  const [pendingOrcamentos, setPendingOrcamentos] = useState<Orcamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const { user, loading: authLoading } = useAuth();
  const { canApprove, loading: roleLoading } = useUserRole();
  const { logActivity } = useActivityLog();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!roleLoading && !canApprove && user) {
      toast({ title: 'Acesso negado', description: 'Você não tem permissão para acessar esta página', variant: 'destructive' });
      navigate('/');
    }
  }, [canApprove, roleLoading, user, navigate, toast]);

  useEffect(() => {
    if (canApprove) {
      fetchAllPendingData();
    }
  }, [canApprove]);

  const fetchAllPendingData = async () => {
    setIsLoading(true);
    
    const [perfRes, onRes, offRes, eventosRes, brindesRes, orcRes] = await Promise.all([
      supabase.from('publicidade_dados').select('*').eq('status', 'pendente').order('created_at', { ascending: false }),
      supabase.from('midia_on').select('*').eq('status', 'pendente').order('created_at', { ascending: false }),
      supabase.from('midia_off').select('*').eq('status', 'pendente').order('created_at', { ascending: false }),
      supabase.from('eventos').select('*').eq('status', 'pendente').order('created_at', { ascending: false }),
      supabase.from('brindes').select('*').eq('status', 'pendente').order('created_at', { ascending: false }),
      supabase.from('orcamentos').select('*').eq('status', 'pendente').order('created_at', { ascending: false }),
    ]);

    setPendingPerformance(perfRes.data || []);
    setPendingMidiaOn(onRes.data || []);
    setPendingMidiaOff(offRes.data || []);
    setPendingEventos(eventosRes.data || []);
    setPendingBrindes(brindesRes.data || []);
    setPendingOrcamentos((orcRes.data as Orcamento[]) || []);
    
    setIsLoading(false);
  };

  const handleAction = async (table: string, id: string, action: 'approve' | 'reject') => {
    setProcessingId(id);
    const newStatus = action === 'approve' ? 'aprovado' : 'rascunho';
    
    const { error } = await supabase
      .from(table as any)
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      toast({ title: 'Erro', description: `Erro ao ${action === 'approve' ? 'aprovar' : 'rejeitar'}`, variant: 'destructive' });
    } else {
      // Log the approval/rejection action
      await logActivity(
        action === 'approve' ? 'approve' : 'reject', 
        table, 
        id, 
        { new_status: newStatus }
      );
      
      toast({ 
        title: action === 'approve' ? 'Aprovado!' : 'Rejeitado', 
        description: action === 'approve' ? 'Dados aprovados com sucesso!' : 'Dados retornados para correção'
      });
      fetchAllPendingData();
    }
    setProcessingId(null);
  };

  const getTotalPending = () => {
    return pendingPerformance.length + pendingMidiaOn.length + pendingMidiaOff.length + 
           pendingEventos.length + pendingBrindes.length + pendingOrcamentos.length;
  };

  const renderEmptyState = () => (
    <div className="text-center py-12 text-muted-foreground">
      <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p className="text-lg">Nenhum item pendente de aprovação</p>
    </div>
  );

  const renderActionButtons = (table: string, id: string) => (
    <div className="flex justify-center gap-2">
      <Button
        size="sm"
        variant="default"
        className="bg-green-600 hover:bg-green-700"
        onClick={() => handleAction(table, id, 'approve')}
        disabled={processingId === id}
      >
        {processingId === id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => handleAction(table, id, 'reject')}
        disabled={processingId === id}
      >
        <XCircle className="h-4 w-4" />
      </Button>
    </div>
  );

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!canApprove) {
    return null;
  }

  return (
    <AppLayout>
      <main className="container mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Aprovações Pendentes
              {getTotalPending() > 0 && (
                <Badge variant="secondary">{getTotalPending()}</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Revise e aprove os dados enviados pelos usuários
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : getTotalPending() === 0 ? (
              renderEmptyState()
            ) : (
              <Tabs defaultValue="performance">
                <TabsList className="grid w-full grid-cols-6 mb-4">
                  <TabsTrigger value="performance" className="relative">
                    Performance
                    {pendingPerformance.length > 0 && (
                      <Badge className="ml-1 h-5 px-1.5" variant="secondary">{pendingPerformance.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="midia_on">
                    Mídia On
                    {pendingMidiaOn.length > 0 && (
                      <Badge className="ml-1 h-5 px-1.5" variant="secondary">{pendingMidiaOn.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="midia_off">
                    Mídia Off
                    {pendingMidiaOff.length > 0 && (
                      <Badge className="ml-1 h-5 px-1.5" variant="secondary">{pendingMidiaOff.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="eventos">
                    Eventos
                    {pendingEventos.length > 0 && (
                      <Badge className="ml-1 h-5 px-1.5" variant="secondary">{pendingEventos.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="brindes">
                    Brindes
                    {pendingBrindes.length > 0 && (
                      <Badge className="ml-1 h-5 px-1.5" variant="secondary">{pendingBrindes.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="orcamentos">
                    Orçamentos
                    {pendingOrcamentos.length > 0 && (
                      <Badge className="ml-1 h-5 px-1.5" variant="secondary">{pendingOrcamentos.length}</Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* Performance Tab */}
                <TabsContent value="performance">
                  {pendingPerformance.length === 0 ? renderEmptyState() : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Mês/Ano</TableHead>
                            <TableHead>Marca</TableHead>
                            <TableHead>Unidade</TableHead>
                            <TableHead className="text-right">Leads Real</TableHead>
                            <TableHead className="text-right">CAC Real</TableHead>
                            <TableHead className="text-right">CPL Real</TableHead>
                            <TableHead className="text-center">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingPerformance.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.month}/{item.year}</TableCell>
                              <TableCell>{item.marca}</TableCell>
                              <TableCell>{item.unidade}</TableCell>
                              <TableCell className="text-right">{item.leads_real.toLocaleString()}</TableCell>
                              <TableCell className="text-right">{formatCurrency(Number(item.cac_real))}</TableCell>
                              <TableCell className="text-right">{formatCurrency(Number(item.cpl_real))}</TableCell>
                              <TableCell>{renderActionButtons('publicidade_dados', item.id)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                {/* Mídia On Tab */}
                <TabsContent value="midia_on">
                  {pendingMidiaOn.length === 0 ? renderEmptyState() : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Mês/Ano</TableHead>
                            <TableHead>Marca</TableHead>
                            <TableHead>Fornecedor</TableHead>
                            <TableHead className="text-right">Orçamento</TableHead>
                            <TableHead className="text-right">Realizado</TableHead>
                            <TableHead className="text-center">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingMidiaOn.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.mes}/{item.ano}</TableCell>
                              <TableCell>{item.marca}</TableCell>
                              <TableCell>{item.fornecedor}</TableCell>
                              <TableCell className="text-right">{formatCurrency(Number(item.orcamento_on))}</TableCell>
                              <TableCell className="text-right">{formatCurrency(Number(item.valor_realizado))}</TableCell>
                              <TableCell>{renderActionButtons('midia_on', item.id)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                {/* Mídia Off Tab */}
                <TabsContent value="midia_off">
                  {pendingMidiaOff.length === 0 ? renderEmptyState() : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Mês/Ano</TableHead>
                            <TableHead>Marca</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-right">Orçamento</TableHead>
                            <TableHead className="text-right">Realizado</TableHead>
                            <TableHead className="text-center">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingMidiaOff.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.mes}/{item.ano}</TableCell>
                              <TableCell>{item.marca}</TableCell>
                              <TableCell>{item.tipo_midia}</TableCell>
                              <TableCell className="text-right">{formatCurrency(Number(item.orcamento_off))}</TableCell>
                              <TableCell className="text-right">{formatCurrency(Number(item.valor_realizado))}</TableCell>
                              <TableCell>{renderActionButtons('midia_off', item.id)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                {/* Eventos Tab */}
                <TabsContent value="eventos">
                  {pendingEventos.length === 0 ? renderEmptyState() : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Evento</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Marca</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead className="text-right">Orçamento</TableHead>
                            <TableHead className="text-center">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingEventos.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.nome_evento}</TableCell>
                              <TableCell>{item.data_evento}</TableCell>
                              <TableCell>{item.marca}</TableCell>
                              <TableCell>{item.categoria}</TableCell>
                              <TableCell className="text-right">{formatCurrency(Number(item.orcamento_evento))}</TableCell>
                              <TableCell>{renderActionButtons('eventos', item.id)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                {/* Brindes Tab */}
                <TabsContent value="brindes">
                  {pendingBrindes.length === 0 ? renderEmptyState() : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Mês/Ano</TableHead>
                            <TableHead>Marca</TableHead>
                            <TableHead className="text-right">Qtd</TableHead>
                            <TableHead className="text-right">Valor Orçado</TableHead>
                            <TableHead className="text-center">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingBrindes.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.descricao}</TableCell>
                              <TableCell>{item.mes}/{item.ano}</TableCell>
                              <TableCell>{item.marca}</TableCell>
                              <TableCell className="text-right">{item.quantidade}</TableCell>
                              <TableCell className="text-right">{formatCurrency(Number(item.valor_orcado))}</TableCell>
                              <TableCell>{renderActionButtons('brindes', item.id)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                {/* Orçamentos Tab */}
                <TabsContent value="orcamentos">
                  {pendingOrcamentos.length === 0 ? renderEmptyState() : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Período</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Marca</TableHead>
                            <TableHead>Unidade</TableHead>
                            <TableHead className="text-right">Valor Orçado</TableHead>
                            <TableHead className="text-right">Verba Extra</TableHead>
                            <TableHead className="text-center">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingOrcamentos.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.mes}/{item.ano}</TableCell>
                              <TableCell>{item.tipo}</TableCell>
                              <TableCell>{item.marca}</TableCell>
                              <TableCell>{item.unidade || 'Geral'}</TableCell>
                              <TableCell className="text-right">{formatCurrency(Number(item.valor_orcado))}</TableCell>
                              <TableCell className="text-right">{formatCurrency(Number(item.verba_extra))}</TableCell>
                              <TableCell>{renderActionButtons('orcamentos', item.id)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </main>
    </AppLayout>
  );
};

export default GestorApproval;
