import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useActivityLog } from '@/hooks/useActivityLog';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2, Search, Building2 } from 'lucide-react';

interface Fornecedor {
  id: string;
  nome: string;
  tipo: string;
  cnpj: string | null;
  contato: string | null;
  email: string | null;
  telefone: string | null;
  observacoes: string | null;
  ativo: boolean;
  created_at: string;
}

const TIPOS_FORNECEDOR = [
  { value: 'midia_on', label: 'Mídia On' },
  { value: 'midia_off', label: 'Mídia Off' },
  { value: 'brindes', label: 'Brindes' },
  { value: 'eventos', label: 'Eventos' },
];

// Mask functions
const maskCNPJ = (value: string): string => {
  return value
    .replace(/\D/g, '')
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

const maskPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
};

const isValidEmail = (email: string): boolean => {
  if (!email) return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const Fornecedores = () => {
  const { user, loading: authLoading } = useAuth();
  const { canEditForms, isAdmin, loading: roleLoading } = useUserRole();
  const { logActivity } = useActivityLog();
  const navigate = useNavigate();
  
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    tipo: '',
    cnpj: '',
    contato: '',
    email: '',
    telefone: '',
    observacoes: '',
    ativo: true,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchFornecedores();
    }
  }, [user]);

  const fetchFornecedores = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('fornecedores')
      .select('*')
      .order('nome');
    
    if (error) {
      toast.error('Erro ao carregar fornecedores');
      console.error(error);
    } else {
      setFornecedores(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.tipo) {
      toast.error('Nome e tipo são obrigatórios');
      return;
    }

    if (formData.email && !isValidEmail(formData.email)) {
      toast.error('E-mail inválido');
      return;
    }

    const payload = {
      nome: formData.nome,
      tipo: formData.tipo,
      cnpj: formData.cnpj || null,
      contato: formData.contato || null,
      email: formData.email || null,
      telefone: formData.telefone || null,
      observacoes: formData.observacoes || null,
      ativo: formData.ativo,
    };

    if (editingFornecedor) {
      const { error } = await supabase
        .from('fornecedores')
        .update(payload)
        .eq('id', editingFornecedor.id);
      
      if (error) {
        toast.error('Erro ao atualizar fornecedor');
        console.error(error);
      } else {
        await logActivity('update', 'fornecedores', editingFornecedor.id, { nome: payload.nome, tipo: payload.tipo });
        toast.success('Fornecedor atualizado com sucesso');
        setIsDialogOpen(false);
        resetForm();
        fetchFornecedores();
      }
    } else {
      const { data, error } = await supabase
        .from('fornecedores')
        .insert(payload)
        .select()
        .single();
      
      if (error) {
        toast.error('Erro ao criar fornecedor');
        console.error(error);
      } else {
        await logActivity('insert', 'fornecedores', data?.id || null, { nome: payload.nome, tipo: payload.tipo });
        toast.success('Fornecedor criado com sucesso');
        setIsDialogOpen(false);
        resetForm();
        fetchFornecedores();
      }
    }
  };

  const handleEdit = (fornecedor: Fornecedor) => {
    setEditingFornecedor(fornecedor);
    setFormData({
      nome: fornecedor.nome,
      tipo: fornecedor.tipo,
      cnpj: fornecedor.cnpj || '',
      contato: fornecedor.contato || '',
      email: fornecedor.email || '',
      telefone: fornecedor.telefone || '',
      observacoes: fornecedor.observacoes || '',
      ativo: fornecedor.ativo,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este fornecedor?')) return;
    
    const fornecedorToDelete = fornecedores.find(f => f.id === id);
    const { error } = await supabase
      .from('fornecedores')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast.error('Erro ao excluir fornecedor');
      console.error(error);
    } else {
      await logActivity('delete', 'fornecedores', id, { nome: fornecedorToDelete?.nome, tipo: fornecedorToDelete?.tipo });
      toast.success('Fornecedor excluído com sucesso');
      fetchFornecedores();
    }
  };

  const resetForm = () => {
    setEditingFornecedor(null);
    setFormData({
      nome: '',
      tipo: '',
      cnpj: '',
      contato: '',
      email: '',
      telefone: '',
      observacoes: '',
      ativo: true,
    });
  };

  const filteredFornecedores = fornecedores.filter(f => {
    const matchesSearch = f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.cnpj && f.cnpj.includes(searchTerm));
    const matchesTipo = filterTipo === 'all' || f.tipo === filterTipo;
    return matchesSearch && matchesTipo;
  });

  const getTipoLabel = (tipo: string) => {
    return TIPOS_FORNECEDOR.find(t => t.value === tipo)?.label || tipo;
  };

  const canEdit = canEditForms;

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background transition-[margin] duration-200" style={{ marginLeft: 'var(--sidebar-w, 15rem)' }}>
      <AppHeader />
      <main className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Cadastro de Fornecedores
            </CardTitle>
            {canEdit && (
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Fornecedor
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingFornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome *</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Nome do fornecedor"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo *</Label>
                      <Select
                        value={formData.tipo}
                        onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_FORNECEDOR.map((tipo) => (
                            <SelectItem key={tipo.value} value={tipo.value}>
                              {tipo.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cnpj">CNPJ</Label>
                        <Input
                          id="cnpj"
                          value={formData.cnpj}
                          onChange={(e) => setFormData({ ...formData, cnpj: maskCNPJ(e.target.value) })}
                          placeholder="00.000.000/0000-00"
                          maxLength={18}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefone">Telefone</Label>
                        <Input
                          id="telefone"
                          value={formData.telefone}
                          onChange={(e) => setFormData({ ...formData, telefone: maskPhone(e.target.value) })}
                          placeholder="(00) 00000-0000"
                          maxLength={15}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contato">Contato</Label>
                      <Input
                        id="contato"
                        value={formData.contato}
                        onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
                        placeholder="Nome do contato"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase().trim() })}
                        placeholder="email@fornecedor.com"
                        className={formData.email && !isValidEmail(formData.email) ? 'border-destructive' : ''}
                      />
                      {formData.email && !isValidEmail(formData.email) && (
                        <p className="text-xs text-destructive">E-mail inválido</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="observacoes">Observações</Label>
                      <Textarea
                        id="observacoes"
                        value={formData.observacoes}
                        onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                        placeholder="Observações adicionais"
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        id="ativo"
                        checked={formData.ativo}
                        onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                      />
                      <Label htmlFor="ativo">Ativo</Label>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">
                        {editingFornecedor ? 'Atualizar' : 'Criar'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {TIPOS_FORNECEDOR.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredFornecedores.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum fornecedor encontrado
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="hidden md:table-cell">CNPJ</TableHead>
                      <TableHead className="hidden lg:table-cell">Contato</TableHead>
                      <TableHead className="hidden lg:table-cell">E-mail</TableHead>
                      <TableHead>Status</TableHead>
                      {canEdit && <TableHead className="text-right">Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFornecedores.map((fornecedor) => (
                      <TableRow key={fornecedor.id}>
                        <TableCell className="font-medium">{fornecedor.nome}</TableCell>
                        <TableCell>{getTipoLabel(fornecedor.tipo)}</TableCell>
                        <TableCell className="hidden md:table-cell">{fornecedor.cnpj || '-'}</TableCell>
                        <TableCell className="hidden lg:table-cell">{fornecedor.contato || '-'}</TableCell>
                        <TableCell className="hidden lg:table-cell">{fornecedor.email || '-'}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            fornecedor.ativo 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {fornecedor.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </TableCell>
                        {canEdit && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(fornecedor)}
                                title="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(fornecedor.id)}
                                  title="Excluir"
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Fornecedores;
