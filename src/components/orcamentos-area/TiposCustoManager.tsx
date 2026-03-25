import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Loader2, FolderTree, Building, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TipoCusto {
  id: string;
  nome: string;
  descricao: string | null;
  tipo_orcamento: 'proprio' | 'compartilhado';
  ativo: boolean;
}

interface TiposCustoManagerProps {
  tiposCusto: TipoCusto[];
  canEdit: boolean;
  onRefresh: () => void;
}

export const TiposCustoManager = ({ tiposCusto, canEdit, onRefresh }: TiposCustoManagerProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoCusto | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipoOrcamento, setTipoOrcamento] = useState<'proprio' | 'compartilhado'>('proprio');
  const [ativo, setAtivo] = useState(true);

  const resetForm = () => {
    setNome('');
    setDescricao('');
    setTipoOrcamento('proprio');
    setAtivo(true);
    setEditingTipo(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (tipo: TipoCusto) => {
    setEditingTipo(tipo);
    setNome(tipo.nome);
    setDescricao(tipo.descricao || '');
    setTipoOrcamento(tipo.tipo_orcamento);
    setAtivo(tipo.ativo);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setSaving(true);
    try {
      const data = {
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        tipo_orcamento: tipoOrcamento,
        ativo,
      };

      if (editingTipo) {
        const { error } = await supabase
          .from('tipos_custo')
          .update(data)
          .eq('id', editingTipo.id);
        
        if (error) throw error;
        toast.success('Centro de custo atualizado!');
      } else {
        const { error } = await supabase
          .from('tipos_custo')
          .insert(data);
        
        if (error) throw error;
        toast.success('Centro de custo criado!');
      }

      setDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (error: any) {
      const msg = error.message?.includes('duplicate') 
        ? 'Já existe um centro de custo com este nome' 
        : 'Erro ao salvar';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tipos_custo')
        .delete()
        .eq('id', id);
      
      if (error) {
        if (error.message?.includes('foreign key')) {
          toast.error('Este centro de custo está em uso e não pode ser excluído');
        } else {
          throw error;
        }
        return;
      }
      
      toast.success('Centro de custo excluído!');
      onRefresh();
    } catch (error: any) {
      toast.error('Erro ao excluir');
    }
  };

  const handleToggleAtivo = async (tipo: TipoCusto) => {
    try {
      const { error } = await supabase
        .from('tipos_custo')
        .update({ ativo: !tipo.ativo })
        .eq('id', tipo.id);
      
      if (error) throw error;
      onRefresh();
    } catch {
      toast.error('Erro ao atualizar status');
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderTree className="h-5 w-5 text-primary" />
              <CardTitle>Centros de Custo</CardTitle>
            </div>
            {canEdit && (
              <Button size="sm" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-1" />
                Novo
              </Button>
            )}
          </div>
          <CardDescription>Gerencie os tipos de custo para orçamentos de área</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-center">Ativo</TableHead>
                  {canEdit && <TableHead className="w-24">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tiposCusto.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canEdit ? 4 : 3} className="text-center text-muted-foreground py-8">
                      Nenhum centro de custo cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  tiposCusto.map((tipo) => (
                    <TableRow key={tipo.id} className={!tipo.ativo ? 'opacity-50' : ''}>
                      <TableCell>
                        <div>
                          <span className="font-medium">{tipo.nome}</span>
                          {tipo.descricao && (
                            <p className="text-xs text-muted-foreground">{tipo.descricao}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={tipo.tipo_orcamento === 'proprio' 
                            ? 'border-blue-500 text-blue-600' 
                            : 'border-purple-500 text-purple-600'}
                        >
                          {tipo.tipo_orcamento === 'proprio' ? (
                            <><Building className="h-3 w-3 mr-1" /> Próprio</>
                          ) : (
                            <><Users className="h-3 w-3 mr-1" /> Compartilhado</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch 
                          checked={tipo.ativo} 
                          onCheckedChange={() => handleToggleAtivo(tipo)}
                          disabled={!canEdit}
                        />
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(tipo)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir Centro de Custo?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. Se o centro de custo estiver em uso, não será possível excluí-lo.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(tipo.id)}>
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de criação/edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTipo ? 'Editar' : 'Novo'} Centro de Custo</DialogTitle>
            <DialogDescription>
              Centros de custo categorizam os gastos do orçamento de área
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Marketing Digital"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descrição opcional"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tipo de Orçamento</Label>
              <Select value={tipoOrcamento} onValueChange={(v) => setTipoOrcamento(v as 'proprio' | 'compartilhado')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proprio">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Próprio - Orçamento exclusivo da área
                    </div>
                  </SelectItem>
                  <SelectItem value="compartilhado">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Compartilhado - Orçamento dividido entre áreas
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch checked={ativo} onCheckedChange={setAtivo} />
              <Label>Centro de custo ativo</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingTipo ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
