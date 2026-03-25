import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Save } from 'lucide-react';
import { TipoCusto } from '@/hooks/useControleOrcamentario';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ControleTiposCustoTabProps {
  tiposCusto: TipoCusto[];
  onRefresh: () => void;
}

export const ControleTiposCustoTab = ({ tiposCusto, onRefresh }: ControleTiposCustoTabProps) => {
  const { toast } = useToast();
  const [novoTipo, setNovoTipo] = useState({ nome: '', descricao: '' });
  const [saving, setSaving] = useState(false);

  const handleAddTipo = async () => {
    if (!novoTipo.nome.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    const { error } = await supabase.from('tipos_custo').insert({
      nome: novoTipo.nome.trim(),
      descricao: novoTipo.descricao.trim() || null,
    });

    if (error) {
      toast({
        title: 'Erro',
        description: error.message.includes('duplicate')
          ? 'Já existe um tipo de custo com este nome'
          : 'Erro ao criar tipo de custo',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Sucesso',
        description: 'Tipo de custo criado',
      });
      setNovoTipo({ nome: '', descricao: '' });
      onRefresh();
    }

    setSaving(false);
  };

  const handleToggleAtivo = async (id: string, ativo: boolean) => {
    const { error } = await supabase.from('tipos_custo').update({ ativo }).eq('id', id);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar tipo de custo',
        variant: 'destructive',
      });
    } else {
      onRefresh();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('tipos_custo').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Erro',
        description: error.message.includes('violates foreign key')
          ? 'Este tipo de custo está em uso e não pode ser excluído'
          : 'Erro ao excluir tipo de custo',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Sucesso',
        description: 'Tipo de custo excluído',
      });
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulário para novo tipo */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium">Nome *</label>
          <Input
            value={novoTipo.nome}
            onChange={(e) => setNovoTipo((prev) => ({ ...prev, nome: e.target.value }))}
            placeholder="Ex: Marketing Digital"
          />
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium">Descrição</label>
          <Input
            value={novoTipo.descricao}
            onChange={(e) => setNovoTipo((prev) => ({ ...prev, descricao: e.target.value }))}
            placeholder="Descrição opcional"
          />
        </div>
        <Button onClick={handleAddTipo} disabled={saving}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar
        </Button>
      </div>

      {/* Tabela de tipos existentes */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-24">Ativo</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiposCusto.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Nenhum tipo de custo cadastrado
                </TableCell>
              </TableRow>
            ) : (
              tiposCusto.map((tipo) => (
                <TableRow key={tipo.id}>
                  <TableCell className="font-medium">{tipo.nome}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {tipo.descricao || '-'}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={tipo.ativo}
                      onCheckedChange={(checked) => handleToggleAtivo(tipo.id, checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDelete(tipo.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
