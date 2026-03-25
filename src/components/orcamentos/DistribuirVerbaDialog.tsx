import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, ChevronDown, ChevronRight, Save } from 'lucide-react';
import { formatCurrency } from '@/components/midia/shared/formatters';
import { MONTHS, TIPOS_MIDIA } from '@/components/midia/shared/constants';
import { CampanhaCompleta, useCampanhas } from '@/hooks/useCampanhas';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campanhaId: string;
  onSave: () => void;
}

interface LocalDistribuicao {
  id?: string;
  tipo_midia: string;
  valor_alocado: number;
  observacoes: string;
  mensais: LocalMensal[];
  expanded: boolean;
}

interface LocalMensal {
  id?: string;
  mes: number;
  ano: number;
  valor_alocado: number;
  verba_extra: number;
  observacoes: string;
}

export const DistribuirVerbaDialog = ({ open, onOpenChange, campanhaId, onSave }: Props) => {
  const { getCampanhaCompleta, saveDistribuicaoMidia, saveDistribuicaoMensal, deleteDistribuicaoMidia, deleteDistribuicaoMensal } = useCampanhas();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [campanha, setCampanha] = useState<CampanhaCompleta | null>(null);
  const [distribuicoes, setDistribuicoes] = useState<LocalDistribuicao[]>([]);
  const [showAddMidia, setShowAddMidia] = useState(false);
  const [newTipoMidia, setNewTipoMidia] = useState('');
  const [newValorMidia, setNewValorMidia] = useState(0);

  useEffect(() => {
    if (open && campanhaId) {
      loadCampanha();
    }
  }, [open, campanhaId]);

  const loadCampanha = async () => {
    setLoading(true);
    const data = await getCampanhaCompleta(campanhaId);
    if (data) {
      setCampanha(data);
      setDistribuicoes(
        data.distribuicoes.map(d => ({
          id: d.id,
          tipo_midia: d.tipo_midia,
          valor_alocado: Number(d.valor_alocado),
          observacoes: d.observacoes || '',
          mensais: d.mensais.map(m => ({
            id: m.id,
            mes: m.mes,
            ano: m.ano,
            valor_alocado: Number(m.valor_alocado),
            verba_extra: Number(m.verba_extra),
            observacoes: m.observacoes || '',
          })),
          expanded: false,
        }))
      );
    }
    setLoading(false);
  };

  const totalAlocado = useMemo(() => {
    return distribuicoes.reduce((sum, d) => sum + d.valor_alocado, 0);
  }, [distribuicoes]);

  const saldoRestante = useMemo(() => {
    return (campanha?.orcamento_total || 0) - totalAlocado;
  }, [campanha, totalAlocado]);

  const tiposDisponiveis = useMemo(() => {
    const usados = new Set(distribuicoes.map(d => d.tipo_midia));
    return TIPOS_MIDIA.filter(t => !usados.has(t.value));
  }, [distribuicoes]);

  const handleAddDistribuicao = () => {
    if (!newTipoMidia || newValorMidia <= 0) {
      toast.error('Selecione o tipo e informe o valor');
      return;
    }
    if (newValorMidia > saldoRestante) {
      toast.error('Valor excede o saldo disponível');
      return;
    }

    setDistribuicoes([
      ...distribuicoes,
      {
        tipo_midia: newTipoMidia,
        valor_alocado: newValorMidia,
        observacoes: '',
        mensais: [],
        expanded: false,
      },
    ]);
    setNewTipoMidia('');
    setNewValorMidia(0);
    setShowAddMidia(false);
  };

  const handleRemoveDistribuicao = (index: number) => {
    setDistribuicoes(distribuicoes.filter((_, i) => i !== index));
  };

  const toggleExpanded = (index: number) => {
    setDistribuicoes(
      distribuicoes.map((d, i) => (i === index ? { ...d, expanded: !d.expanded } : d))
    );
  };

  const handleAddMensal = (distIndex: number) => {
    if (!campanha) return;
    
    // Find next available month
    const existingMensais = distribuicoes[distIndex].mensais;
    let nextMes = campanha.mes_inicio;
    let nextAno = campanha.ano_inicio;

    if (existingMensais.length > 0) {
      const last = existingMensais[existingMensais.length - 1];
      nextMes = last.mes === 12 ? 1 : last.mes + 1;
      nextAno = last.mes === 12 ? last.ano + 1 : last.ano;
    }

    setDistribuicoes(
      distribuicoes.map((d, i) =>
        i === distIndex
          ? {
              ...d,
              mensais: [
                ...d.mensais,
                { mes: nextMes, ano: nextAno, valor_alocado: 0, verba_extra: 0, observacoes: '' },
              ],
            }
          : d
      )
    );
  };

  const handleRemoveMensal = (distIndex: number, mensalIndex: number) => {
    setDistribuicoes(
      distribuicoes.map((d, i) =>
        i === distIndex
          ? { ...d, mensais: d.mensais.filter((_, mi) => mi !== mensalIndex) }
          : d
      )
    );
  };

  const updateMensal = (distIndex: number, mensalIndex: number, field: keyof LocalMensal, value: any) => {
    setDistribuicoes(
      distribuicoes.map((d, i) =>
        i === distIndex
          ? {
              ...d,
              mensais: d.mensais.map((m, mi) =>
                mi === mensalIndex ? { ...m, [field]: value } : m
              ),
            }
          : d
      )
    );
  };

  const getTotalMensalPorDistribuicao = (distIndex: number) => {
    return distribuicoes[distIndex].mensais.reduce(
      (sum, m) => sum + m.valor_alocado + m.verba_extra,
      0
    );
  };

  const handleSave = async () => {
    if (!campanha) return;

    setSaving(true);
    try {
      // Delete removed distributions
      const existingDistIds = new Set(campanha.distribuicoes.map(d => d.id));
      const newDistIds = new Set(distribuicoes.filter(d => d.id).map(d => d.id!));
      
      for (const id of existingDistIds) {
        if (!newDistIds.has(id)) {
          await deleteDistribuicaoMidia(id);
        }
      }

      // Save/update distributions
      for (const dist of distribuicoes) {
        const distId = await saveDistribuicaoMidia(
          campanha.id,
          dist.tipo_midia,
          dist.valor_alocado,
          dist.observacoes || undefined
        );

        if (distId) {
          // Get existing mensais for this distribution
          const existingDist = campanha.distribuicoes.find(d => d.tipo_midia === dist.tipo_midia);
          const existingMensalIds = new Set(existingDist?.mensais.map(m => m.id) || []);
          const newMensalIds = new Set(dist.mensais.filter(m => m.id).map(m => m.id!));

          // Delete removed mensais
          for (const id of existingMensalIds) {
            if (!newMensalIds.has(id)) {
              await deleteDistribuicaoMensal(id);
            }
          }

          // Save/update mensais
          for (const mensal of dist.mensais) {
            await saveDistribuicaoMensal(
              distId,
              mensal.mes,
              mensal.ano,
              mensal.valor_alocado,
              mensal.verba_extra,
              mensal.observacoes || undefined
            );
          }
        }
      }

      toast.success('Distribuição salva com sucesso!');
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Erro ao salvar distribuição');
    } finally {
      setSaving(false);
    }
  };

  const getTipoLabel = (value: string) => {
    return TIPOS_MIDIA.find(t => t.value === value)?.label || value;
  };

  const getMesLabel = (mes: number) => {
    return MONTHS.find(m => m.value === mes)?.label || '';
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!campanha) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            💰 Distribuir Verba
          </DialogTitle>
          <DialogDescription>
            {campanha.marca} {campanha.unidade ? `- ${campanha.unidade}` : ''} | 
            {getMesLabel(campanha.mes_inicio)}/{campanha.ano_inicio} até {getMesLabel(campanha.mes_fim)}/{campanha.ano_fim}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo do orçamento */}
          <Card className={saldoRestante < 0 ? 'border-destructive bg-destructive/5' : ''}>
            <CardContent className="pt-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Orçamento Total</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(campanha.orcamento_total)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Alocado</p>
                  <p className="text-xl font-bold">{formatCurrency(totalAlocado)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saldo</p>
                  <p className={`text-xl font-bold ${saldoRestante < 0 ? 'text-destructive' : 'text-green-600'}`}>
                    {formatCurrency(saldoRestante)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de distribuições por tipo de mídia */}
          <div className="space-y-4">
            {distribuicoes.map((dist, distIndex) => (
              <Collapsible key={distIndex} open={dist.expanded}>
                <Card>
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => toggleExpanded(distIndex)}>
                            {dist.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                        </CollapsibleTrigger>
                        <div>
                          <CardTitle className="text-base">{getTipoLabel(dist.tipo_midia)}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(dist.valor_alocado)}
                            {dist.mensais.length > 0 && (
                              <span className="ml-2">
                                | Mensal: {formatCurrency(getTotalMensalPorDistribuicao(distIndex))}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveDistribuicao(distIndex)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-4">
                      {/* Distribuição mensal */}
                      <div className="border rounded-lg">
                        <div className="flex items-center justify-between p-3 border-b">
                          <span className="text-sm font-medium">Distribuição por Mês (opcional)</span>
                          <Button size="sm" variant="outline" onClick={() => handleAddMensal(distIndex)}>
                            <Plus className="h-4 w-4 mr-1" /> Adicionar Mês
                          </Button>
                        </div>

                        {dist.mensais.length > 0 && (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-28">Mês</TableHead>
                                <TableHead className="w-20">Ano</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Verba Extra</TableHead>
                                <TableHead>Obs.</TableHead>
                                <TableHead className="w-12"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {dist.mensais.map((mensal, mensalIndex) => (
                                <TableRow key={mensalIndex}>
                                  <TableCell>
                                    <Select
                                      value={mensal.mes.toString()}
                                      onValueChange={(v) => updateMensal(distIndex, mensalIndex, 'mes', parseInt(v))}
                                    >
                                      <SelectTrigger className="h-8">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {MONTHS.map(m => (
                                          <SelectItem key={m.value} value={m.value.toString()}>
                                            {m.label.substring(0, 3)}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      value={mensal.ano}
                                      onChange={(e) => updateMensal(distIndex, mensalIndex, 'ano', parseInt(e.target.value))}
                                      className="h-8 w-20"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <CurrencyInput
                                      value={mensal.valor_alocado}
                                      onChange={(v) => updateMensal(distIndex, mensalIndex, 'valor_alocado', v)}
                                      className="h-8"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <CurrencyInput
                                      value={mensal.verba_extra}
                                      onChange={(v) => updateMensal(distIndex, mensalIndex, 'verba_extra', v)}
                                      className="h-8"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      value={mensal.observacoes}
                                      onChange={(e) => updateMensal(distIndex, mensalIndex, 'observacoes', e.target.value)}
                                      className="h-8"
                                      placeholder="..."
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRemoveMensal(distIndex, mensalIndex)}
                                      className="h-8 w-8"
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}

                        {dist.mensais.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhuma distribuição mensal. Clique em "Adicionar Mês" para distribuir por mês.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}

            {/* Adicionar nova distribuição */}
            {tiposDisponiveis.length > 0 && (
              <Card className="border-dashed">
                <CardContent className="py-4">
                  {!showAddMidia ? (
                    <Button variant="outline" onClick={() => setShowAddMidia(true)} className="w-full">
                      <Plus className="h-4 w-4 mr-2" /> Distribuir Verba
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium mb-2">Tipo de Mídia</p>
                          <Select value={newTipoMidia} onValueChange={setNewTipoMidia}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              {tiposDisponiveis.map(t => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2">Valor Alocado</p>
                          <CurrencyInput
                            value={newValorMidia}
                            onChange={setNewValorMidia}
                            placeholder="0,00"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleAddDistribuicao} className="flex-1">
                          Adicionar
                        </Button>
                        <Button variant="outline" onClick={() => setShowAddMidia(false)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar Distribuição
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
