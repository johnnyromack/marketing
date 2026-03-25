import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useMarcas, useUnidades, Marca, Unidade } from '@/hooks/useMarcasUnidades';
import { AppHeader } from '@/components/AppHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Building2, MapPin, Loader2, DollarSign, ChevronDown } from 'lucide-react';
import { AddressAutocomplete } from '@/components/maps/AddressAutocomplete';

const MarcasUnidades = () => {
  const { user, loading: authLoading } = useAuth();
  const { canEditForms, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  
  const { marcas, loading: marcasLoading, createMarca, updateMarca, deleteMarca } = useMarcas();
  const { unidades, loading: unidadesLoading, createUnidade, updateUnidade, deleteUnidade } = useUnidades();
  
  // State for marca form
  const [newMarcaNome, setNewMarcaNome] = useState('');
  const [isMarcaDialogOpen, setIsMarcaDialogOpen] = useState(false);
  const [editingMarca, setEditingMarca] = useState<Marca | null>(null);
  const [isEditMarcaDialogOpen, setIsEditMarcaDialogOpen] = useState(false);
  
  // State for inline unidade form
  const [addingUnidadeToMarcaId, setAddingUnidadeToMarcaId] = useState<string | null>(null);
  const [newUnidadeNome, setNewUnidadeNome] = useState('');
  const [newUnidadeOrcamentoProprio, setNewUnidadeOrcamentoProprio] = useState(false);
  const [newUnidadeEndereco, setNewUnidadeEndereco] = useState('');
  const [newUnidadeLatitude, setNewUnidadeLatitude] = useState<number | null>(null);
  const [newUnidadeLongitude, setNewUnidadeLongitude] = useState<number | null>(null);
  
  // State for editing unidade
  const [editingUnidade, setEditingUnidade] = useState<Unidade | null>(null);
  const [isEditUnidadeDialogOpen, setIsEditUnidadeDialogOpen] = useState(false);
  
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!roleLoading && user && !canEditForms) {
      toast.error('Acesso restrito');
      navigate('/');
    }
  }, [canEditForms, roleLoading, user, navigate]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!canEditForms) return null;

  const handleCreateMarca = async () => {
    if (!newMarcaNome.trim()) {
      toast.error('Nome da marca é obrigatório');
      return;
    }
    const result = await createMarca(newMarcaNome.trim());
    if (result) {
      setNewMarcaNome('');
      setIsMarcaDialogOpen(false);
    }
  };

  const handleUpdateMarca = async () => {
    if (!editingMarca) return;
    await updateMarca(editingMarca.id, { nome: editingMarca.nome, ativo: editingMarca.ativo });
    setEditingMarca(null);
    setIsEditMarcaDialogOpen(false);
  };

  const handleDeleteMarca = async (id: string) => {
    const unidadesDaMarca = unidades.filter(u => u.marca_id === id);
    if (unidadesDaMarca.length > 0) {
      if (!confirm(`Esta marca possui ${unidadesDaMarca.length} unidade(s). Tem certeza que deseja excluir?`)) return;
    } else {
      if (!confirm('Tem certeza que deseja excluir esta marca?')) return;
    }
    setProcessingId(id);
    await deleteMarca(id);
    setProcessingId(null);
  };

  const handleAddUnidade = async (marcaId: string) => {
    if (!newUnidadeNome.trim()) {
      toast.error('Nome da unidade é obrigatório');
      return;
    }
    const result = await createUnidade({
      marca_id: marcaId,
      nome: newUnidadeNome.trim(),
      orcamento_proprio: newUnidadeOrcamentoProprio,
      endereco: newUnidadeEndereco || undefined,
      latitude: newUnidadeLatitude,
      longitude: newUnidadeLongitude,
    });
    if (result) {
      setNewUnidadeNome('');
      setNewUnidadeOrcamentoProprio(false);
      setNewUnidadeEndereco('');
      setNewUnidadeLatitude(null);
      setNewUnidadeLongitude(null);
      setAddingUnidadeToMarcaId(null);
    }
  };

  const handleUpdateUnidade = async () => {
    if (!editingUnidade) return;
    await updateUnidade(editingUnidade.id, {
      nome: editingUnidade.nome,
      orcamento_proprio: editingUnidade.orcamento_proprio,
      ativo: editingUnidade.ativo,
      endereco: editingUnidade.endereco,
      latitude: editingUnidade.latitude,
      longitude: editingUnidade.longitude,
    });
    setEditingUnidade(null);
    setIsEditUnidadeDialogOpen(false);
  };

  const handleDeleteUnidade = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta unidade?')) return;
    setProcessingId(id);
    await deleteUnidade(id);
    setProcessingId(null);
  };

  const getUnidadesByMarca = (marcaId: string) => {
    return unidades.filter(u => u.marca_id === marcaId);
  };

  const getUnidadesComOrcamentoProprio = (marcaId: string) => {
    return unidades.filter(u => u.marca_id === marcaId && u.orcamento_proprio);
  };

  return (
    <div className="min-h-screen bg-background transition-[margin] duration-200" style={{ marginLeft: 'var(--sidebar-w, 15rem)' }}>
      <AppHeader />
      
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Gestão de Marcas e Unidades
            </CardTitle>
            <Dialog open={isMarcaDialogOpen} onOpenChange={setIsMarcaDialogOpen}>
              <Button className="gap-2" onClick={() => setIsMarcaDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Nova Marca
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Nova Marca</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="marcaNome">Nome da Marca</Label>
                    <Input
                      id="marcaNome"
                      value={newMarcaNome}
                      onChange={(e) => setNewMarcaNome(e.target.value)}
                      placeholder="Ex: Nova Marca"
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateMarca()}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button onClick={handleCreateMarca}>Criar Marca</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          
          <CardContent>
            {marcasLoading || unidadesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : marcas.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma marca cadastrada</p>
                <p className="text-sm">Clique em "Nova Marca" para começar</p>
              </div>
            ) : (
              <Accordion type="multiple" className="w-full space-y-2">
                {marcas.map((marca) => {
                  const marcaUnidades = getUnidadesByMarca(marca.id);
                  const unidadesOrcamento = getUnidadesComOrcamentoProprio(marca.id);
                  
                  return (
                    <AccordionItem 
                      key={marca.id} 
                      value={marca.id}
                      className="border rounded-lg px-4"
                    >
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 flex-1">
                          <Building2 className="h-5 w-5 text-primary" />
                          <span className="font-semibold text-lg">{marca.nome}</span>
                          <Badge variant={marca.ativo ? 'default' : 'secondary'} className="ml-2">
                            {marca.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                          <Badge variant="outline" className="ml-1">
                            {marcaUnidades.length} unidade{marcaUnidades.length !== 1 ? 's' : ''}
                          </Badge>
                          {unidadesOrcamento.length > 0 && (
                            <Badge variant="secondary" className="ml-1 gap-1">
                              <DollarSign className="h-3 w-3" />
                              {unidadesOrcamento.length} com orç. próprio
                            </Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      
                      <AccordionContent className="pt-4 pb-6">
                        {/* Marca Actions */}
                        <div className="flex gap-2 mb-4 pb-4 border-b">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => {
                              setEditingMarca({ ...marca });
                              setIsEditMarcaDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                            Editar Marca
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteMarca(marca.id)}
                            disabled={processingId === marca.id}
                          >
                            {processingId === marca.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            Excluir Marca
                          </Button>
                        </div>
                        
                        {/* Unidades List */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              Unidades
                            </h4>
                            {addingUnidadeToMarcaId !== marca.id && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={() => {
                                  setAddingUnidadeToMarcaId(marca.id);
                                  setNewUnidadeNome('');
                                  setNewUnidadeOrcamentoProprio(false);
                                }}
                              >
                                <Plus className="h-4 w-4" />
                                Adicionar Unidade
                              </Button>
                            )}
                          </div>
                          
                          {/* Add Unidade Form */}
                          {addingUnidadeToMarcaId === marca.id && (
                            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <Label>Nome da Unidade</Label>
                                  <Input
                                    value={newUnidadeNome}
                                    onChange={(e) => setNewUnidadeNome(e.target.value)}
                                    placeholder="Ex: Filial Centro"
                                    autoFocus
                                  />
                                </div>
                                <div className="flex items-end gap-4">
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id={`orcamento-${marca.id}`}
                                      checked={newUnidadeOrcamentoProprio}
                                      onCheckedChange={(checked) => setNewUnidadeOrcamentoProprio(checked === true)}
                                    />
                                    <Label htmlFor={`orcamento-${marca.id}`} className="text-sm flex items-center gap-1">
                                      <DollarSign className="h-4 w-4 text-amber-600" />
                                      Orçamento próprio
                                    </Label>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <Label className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" />
                                  Endereço da Unidade
                                </Label>
                                <AddressAutocomplete
                                  value={newUnidadeEndereco}
                                  onChange={(address, coordinates) => {
                                    setNewUnidadeEndereco(address);
                                    setNewUnidadeLatitude(coordinates?.lat ?? null);
                                    setNewUnidadeLongitude(coordinates?.lng ?? null);
                                  }}
                                  placeholder="Digite o endereço da unidade..."
                                />
                                {newUnidadeLatitude && newUnidadeLongitude && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    📍 Coordenadas: {newUnidadeLatitude.toFixed(5)}, {newUnidadeLongitude.toFixed(5)}
                                  </p>
                                )}
                              </div>
                              {newUnidadeOrcamentoProprio && (
                                <div className="bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 text-sm p-3 rounded-md flex items-center gap-2">
                                  <DollarSign className="h-4 w-4" />
                                  Esta unidade terá orçamento próprio e aparecerá separadamente na gestão de orçamentos.
                                </div>
                              )}
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleAddUnidade(marca.id)}>
                                  Adicionar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setAddingUnidadeToMarcaId(null);
                                    setNewUnidadeNome('');
                                    setNewUnidadeOrcamentoProprio(false);
                                    setNewUnidadeEndereco('');
                                    setNewUnidadeLatitude(null);
                                    setNewUnidadeLongitude(null);
                                  }}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {/* Unidades Table */}
                          {marcaUnidades.length > 0 ? (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Nome</TableHead>
                                  <TableHead>Orçamento</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {marcaUnidades.map((unidade) => (
                                  <TableRow key={unidade.id}>
                                    <TableCell className="font-medium">{unidade.nome}</TableCell>
                                    <TableCell>
                                      {unidade.orcamento_proprio ? (
                                        <Badge className="gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                                          <DollarSign className="h-3 w-3" />
                                          Próprio
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline">Compartilhado</Badge>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={unidade.ativo ? 'default' : 'secondary'}>
                                        {unidade.ativo ? 'Ativo' : 'Inativo'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex gap-1 justify-end">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => {
                                            setEditingUnidade({ ...unidade });
                                            setIsEditUnidadeDialogOpen(true);
                                          }}
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="text-destructive"
                                          onClick={() => handleDeleteUnidade(unidade.id)}
                                          disabled={processingId === unidade.id}
                                        >
                                          {processingId === unidade.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <Trash2 className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-lg">
                              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">Nenhuma unidade cadastrada para esta marca</p>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </main>
      
      {/* Edit Marca Dialog */}
      <Dialog open={isEditMarcaDialogOpen} onOpenChange={setIsEditMarcaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Marca</DialogTitle>
          </DialogHeader>
          {editingMarca && (
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={editingMarca.nome}
                  onChange={(e) => setEditingMarca({ ...editingMarca, nome: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingMarca.ativo}
                  onCheckedChange={(checked) => setEditingMarca({ ...editingMarca, ativo: checked })}
                />
                <Label>Ativo</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleUpdateMarca}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Unidade Dialog */}
      <Dialog open={isEditUnidadeDialogOpen} onOpenChange={setIsEditUnidadeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Unidade</DialogTitle>
          </DialogHeader>
          {editingUnidade && (
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={editingUnidade.nome}
                  onChange={(e) => setEditingUnidade({ ...editingUnidade, nome: e.target.value })}
                />
              </div>
              <div>
                <Label className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  Endereço
                </Label>
                <AddressAutocomplete
                  value={editingUnidade.endereco || ''}
                  onChange={(address, coordinates) => setEditingUnidade({
                    ...editingUnidade,
                    endereco: address,
                    latitude: coordinates?.lat ?? null,
                    longitude: coordinates?.lng ?? null,
                  })}
                  placeholder="Digite o endereço da unidade..."
                />
                {editingUnidade.latitude && editingUnidade.longitude && (
                  <p className="text-xs text-muted-foreground mt-1">
                    📍 Coordenadas: {editingUnidade.latitude.toFixed(5)}, {editingUnidade.longitude.toFixed(5)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="editOrcamentoProprio"
                  checked={editingUnidade.orcamento_proprio}
                  onCheckedChange={(checked) => 
                    setEditingUnidade({ ...editingUnidade, orcamento_proprio: checked === true })
                  }
                />
                <Label htmlFor="editOrcamentoProprio" className="text-sm flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-amber-600" />
                  Orçamento próprio
                </Label>
              </div>
              {editingUnidade.orcamento_proprio && (
                <div className="bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 text-sm p-3 rounded-md flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Esta unidade aparecerá separadamente na gestão de orçamentos.
                </div>
              )}
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingUnidade.ativo}
                  onCheckedChange={(checked) => setEditingUnidade({ ...editingUnidade, ativo: checked })}
                />
                <Label>Ativo</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleUpdateUnidade}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarcasUnidades;
