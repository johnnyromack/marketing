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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Users, RefreshCw, KeyRound, Pencil, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

type AppRole = 'admin' | 'gestor' | 'editor' | 'leitor';

interface UserWithRole {
  id: string;
  email: string | null;
  full_name: string | null;
  roles: Array<{ role: AppRole; gestor_id: string | null; must_change_password: boolean }>;
  gestor_name?: string | null;
  status: 'ativo' | 'pendente';
}

interface GestorOption {
  id: string;
  full_name: string | null;
  email: string | null;
}

const AdminUsers = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('editor');
  const [selectedGestor, setSelectedGestor] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [gestores, setGestores] = useState<GestorOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  // Reset password state
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserWithRole | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  
  // Edit role state
  const [editRoleOpen, setEditRoleOpen] = useState(false);
  const [editRoleUser, setEditRoleUser] = useState<UserWithRole | null>(null);
  const [editSelectedRole, setEditSelectedRole] = useState<AppRole>('editor');
  const [editSelectedGestor, setEditSelectedGestor] = useState<string>('');
  const [isEditingRole, setIsEditingRole] = useState(false);
  
  // Delete user state
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<UserWithRole | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  
  const { user, loading: authLoading } = useAuth();
  const { role, isAdmin, isGestor, isEditor, canManageUsers, loading: roleLoading } = useUserRole();
  const { logActivity } = useActivityLog();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!roleLoading && !canManageUsers && user) {
      toast({ title: 'Acesso negado', description: 'Você não tem permissão para acessar esta página', variant: 'destructive' });
      navigate('/');
    }
  }, [canManageUsers, roleLoading, user, navigate, toast]);

  useEffect(() => {
    if (canManageUsers) {
      fetchUsers();
    }
  }, [canManageUsers]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    
    // Fetch profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      toast({ title: 'Erro', description: 'Erro ao carregar usuários', variant: 'destructive' });
      setLoadingUsers(false);
      return;
    }

    // Fetch all roles with gestor_id and must_change_password
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role, gestor_id, must_change_password');

    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
    }

    // Build users with roles and gestor info
    const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => {
      const userRoles = roles?.filter(r => r.user_id === profile.id) || [];
      const gestorRole = userRoles.find(r => r.gestor_id);
      const gestorProfile = gestorRole?.gestor_id 
        ? profiles.find(p => p.id === gestorRole.gestor_id)
        : null;
      
      // User is "pendente" if any role has must_change_password = true, otherwise "ativo"
      const mustChangePassword = userRoles.some(r => r.must_change_password);
      
      return {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        roles: userRoles.map(r => ({ 
          role: r.role as AppRole, 
          gestor_id: r.gestor_id,
          must_change_password: r.must_change_password 
        })),
        gestor_name: gestorProfile?.full_name || null,
        status: mustChangePassword ? 'pendente' : 'ativo' as const
      };
    });

    // Extract gestores (users with admin or gestor role)
    const gestorList: GestorOption[] = usersWithRoles
      .filter(u => u.roles.some(r => r.role === 'admin' || r.role === 'gestor'))
      .map(u => ({ id: u.id, full_name: u.full_name, email: u.email }));

    setUsers(usersWithRoles);
    setGestores(gestorList);
    setLoadingUsers(false);
  };

  // Roles that the current user can create
  const getAvailableRoles = (): AppRole[] => {
    if (isAdmin) {
      return ['admin', 'gestor', 'editor', 'leitor'];
    } else if (isGestor) {
      // Gestor can create gestor, editor, leitor
      return ['gestor', 'editor', 'leitor'];
    }
    return [];
  };

  // Check if selected role needs a gestor assignment
  const needsGestorAssignment = selectedRole === 'editor' || selectedRole === 'leitor';

  // Check if current user can reset password for target user
  const canResetPasswordFor = (targetUser: UserWithRole): boolean => {
    if (isAdmin) return true;
    
    if (isGestor) {
      // Gestor cannot reset Admin passwords
      const isTargetAdmin = targetUser.roles.some(r => r.role === 'admin');
      if (isTargetAdmin) return false;
      
      // Gestor cannot reset other Gestor passwords
      const isTargetGestor = targetUser.roles.some(r => r.role === 'gestor');
      if (isTargetGestor) return false;
      
      // Gestor can only reset passwords of users they manage
      const isUnderMyManagement = targetUser.roles.some(r => r.gestor_id === user?.id);
      return isUnderMyManagement;
    }
    
    return false;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !fullName) {
      toast({ title: 'Erro', description: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }

    if (password.length < 6) {
      toast({ title: 'Erro', description: 'A senha deve ter pelo menos 6 caracteres', variant: 'destructive' });
      return;
    }

    if (needsGestorAssignment && !selectedGestor) {
      toast({ title: 'Erro', description: 'Selecione um gestor para o usuário', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    // Create user via edge function (admin-only operation)
    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: { 
        email, 
        password, 
        fullName, 
        role: selectedRole,
        gestorId: needsGestorAssignment ? selectedGestor : undefined
      }
    });

    setIsLoading(false);

    if (error) {
      console.error('Edge function error:', error);
      toast({ title: 'Erro ao criar usuário', description: error.message, variant: 'destructive' });
      return;
    }

    if (data?.error) {
      toast({ title: 'Erro ao criar usuário', description: data.error, variant: 'destructive' });
      return;
    }

    await logActivity('create_user', 'user_roles', data?.user?.id || null, { 
      email, 
      fullName, 
      role: selectedRole 
    });
    
    toast({ 
      title: 'Sucesso!', 
      description: 'Usuário criado! No primeiro acesso, ele deverá criar uma nova senha.' 
    });
    setEmail('');
    setPassword('');
    setFullName('');
    setSelectedRole('editor');
    setSelectedGestor('');
    fetchUsers();
  };

  const handleOpenResetPassword = (targetUser: UserWithRole) => {
    setResetPasswordUser(targetUser);
    setNewPassword('');
    setResetPasswordOpen(true);
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUser) return;
    
    if (!newPassword || newPassword.length < 6) {
      toast({ title: 'Erro', description: 'A senha deve ter pelo menos 6 caracteres', variant: 'destructive' });
      return;
    }

    setIsResettingPassword(true);

    const { data, error } = await supabase.functions.invoke('admin-reset-password', {
      body: { 
        targetUserId: resetPasswordUser.id, 
        newPassword 
      }
    });

    setIsResettingPassword(false);

    if (error) {
      console.error('Edge function error:', error);
      toast({ title: 'Erro ao resetar senha', description: error.message, variant: 'destructive' });
      return;
    }

    if (data?.error) {
      toast({ title: 'Erro ao resetar senha', description: data.error, variant: 'destructive' });
      return;
    }

    await logActivity('reset_password', 'user_roles', resetPasswordUser.id, { 
      email: resetPasswordUser.email 
    });
    
    toast({ 
      title: 'Senha resetada!', 
      description: `${resetPasswordUser.full_name || resetPasswordUser.email} deverá criar nova senha no próximo acesso.` 
    });
    setResetPasswordOpen(false);
    setResetPasswordUser(null);
    setNewPassword('');
  };

  // Check if current user can edit role for target user - ONLY ADMINS
  const canEditRoleFor = (targetUser: UserWithRole): boolean => {
    if (targetUser.id === user?.id) return false; // Can't edit own role
    return isAdmin;
  };

  // Check if current user can delete target user
  // Admin: can delete any user (except self)
  // Gestor: can delete editor and leitor
  // Editor: can delete leitor only
  const canDeleteUserFor = (targetUser: UserWithRole): boolean => {
    if (targetUser.id === user?.id) return false; // Can't delete self
    
    const targetRole = targetUser.roles[0]?.role;
    
    if (isAdmin) return true;
    
    if (isGestor) {
      // Gestor can delete editor and leitor
      return targetRole === 'editor' || targetRole === 'leitor';
    }
    
    if (isEditor) {
      // Editor can delete leitor only
      return targetRole === 'leitor';
    }
    
    return false;
  };

  const handleOpenDeleteUser = (targetUser: UserWithRole) => {
    setDeleteUser(targetUser);
    setDeleteUserOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    
    setIsDeletingUser(true);

    try {
      // Delete user role first
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', deleteUser.id);

      if (roleError) throw roleError;

      // Delete profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', deleteUser.id);

      if (profileError) throw profileError;

      await logActivity('delete_user', 'user_roles', deleteUser.id, { 
        email: deleteUser.email,
        role: deleteUser.roles[0]?.role
      });
      
      toast({ 
        title: 'Usuário excluído!', 
        description: `${deleteUser.full_name || deleteUser.email} foi removido do sistema.` 
      });
      setDeleteUserOpen(false);
      setDeleteUser(null);
      fetchUsers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({ title: 'Erro ao excluir usuário', description: message, variant: 'destructive' });
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleOpenEditRole = (targetUser: UserWithRole) => {
    setEditRoleUser(targetUser);
    const currentRole = targetUser.roles[0]?.role || 'editor';
    const currentGestor = targetUser.roles[0]?.gestor_id || '';
    setEditSelectedRole(currentRole);
    setEditSelectedGestor(currentGestor);
    setEditRoleOpen(true);
  };

  const handleEditRole = async () => {
    if (!editRoleUser) return;
    
    const needsGestor = editSelectedRole === 'editor' || editSelectedRole === 'leitor';
    
    if (needsGestor && !editSelectedGestor) {
      toast({ title: 'Erro', description: 'Selecione um gestor para este papel', variant: 'destructive' });
      return;
    }

    setIsEditingRole(true);

    try {
      // Update user role
      const { error } = await supabase
        .from('user_roles')
        .update({ 
          role: editSelectedRole,
          gestor_id: needsGestor ? editSelectedGestor : null
        })
        .eq('user_id', editRoleUser.id);

      if (error) {
        throw error;
      }

      await logActivity('update_role', 'user_roles', editRoleUser.id, { 
        email: editRoleUser.email,
        oldRole: editRoleUser.roles[0]?.role,
        newRole: editSelectedRole
      });
      
      toast({ 
        title: 'Papel atualizado!', 
        description: `${editRoleUser.full_name || editRoleUser.email} agora é ${getRoleLabel(editSelectedRole)}.` 
      });
      setEditRoleOpen(false);
      setEditRoleUser(null);
      fetchUsers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({ title: 'Erro ao atualizar papel', description: message, variant: 'destructive' });
    } finally {
      setIsEditingRole(false);
    }
  };

  const getRoleBadge = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return <Badge variant="default">Admin</Badge>;
      case 'gestor':
        return <Badge className="bg-amber-500 hover:bg-amber-600">Gestor</Badge>;
      case 'editor':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Editor</Badge>;
      case 'leitor':
        return <Badge variant="secondary">Leitor</Badge>;
      default:
        return <Badge variant="outline">Sem papel</Badge>;
    }
  };

  const getRoleBadges = (roles: Array<{ role: AppRole; gestor_id: string | null }>) => {
    if (!roles || roles.length === 0) {
      return <Badge variant="outline">Sem papel</Badge>;
    }
    
    return (
      <div className="flex gap-1 flex-wrap">
        {roles.map((r, idx) => (
          <span key={idx}>{getRoleBadge(r.role)}</span>
        ))}
      </div>
    );
  };

  const getRoleLabel = (role: AppRole): string => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'gestor': return 'Gestor';
      case 'editor': return 'Editor';
      case 'leitor': return 'Leitor';
    }
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!canManageUsers) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background transition-[margin] duration-200" style={{ marginLeft: 'var(--sidebar-w, 15rem)' }}>
      <AppHeader />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Create User Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Criar Novo Usuário
              </CardTitle>
              <CardDescription>
                Adicione um novo usuário ao sistema. Uma senha temporária será criada e o usuário deverá alterá-la no primeiro acesso.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Nome do usuário"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha Temporária</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    O usuário será obrigado a criar uma nova senha no primeiro acesso
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Papel</Label>
                  <Select 
                    value={selectedRole} 
                    onValueChange={(value: AppRole) => {
                      setSelectedRole(value);
                      if (value === 'admin' || value === 'gestor') setSelectedGestor('');
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o papel" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableRoles().map(role => (
                        <SelectItem key={role} value={role}>
                          {getRoleLabel(role)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {selectedRole === 'admin' && 'Acesso total ao sistema'}
                    {selectedRole === 'gestor' && 'Aprova dados, gerencia usuários e visualiza logs'}
                    {selectedRole === 'editor' && 'Preenche formulários e visualiza dashboards'}
                    {selectedRole === 'leitor' && 'Apenas visualiza dashboards e exporta dados'}
                  </p>
                </div>
                
                {needsGestorAssignment && (
                  <div className="space-y-2">
                    <Label htmlFor="gestor">Gestor Responsável</Label>
                    <Select 
                      value={selectedGestor} 
                      onValueChange={setSelectedGestor}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o gestor" />
                      </SelectTrigger>
                      <SelectContent>
                        {gestores.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.full_name || g.email || 'Sem nome'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      O gestor poderá aprovar os dados inseridos por este usuário
                    </p>
                  </div>
                )}
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                  Criar Usuário
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Users List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Usuários Cadastrados
                  </CardTitle>
                  <CardDescription>
                    Lista de todos os usuários do sistema
                  </CardDescription>
                </div>
                <Button variant="outline" size="icon" onClick={fetchUsers} disabled={loadingUsers}>
                  <RefreshCw className={`h-4 w-4 ${loadingUsers ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : users.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum usuário cadastrado
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Papel</TableHead>
                        <TableHead>Gestor</TableHead>
                        <TableHead className="w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.full_name || '-'}</TableCell>
                          <TableCell className="text-sm">{u.email || '-'}</TableCell>
                          <TableCell>
                            {u.status === 'ativo' ? (
                              <Badge className="bg-green-500 hover:bg-green-600">Ativo</Badge>
                            ) : (
                              <Badge variant="outline" className="border-amber-500 text-amber-500">Pendente</Badge>
                            )}
                          </TableCell>
                          <TableCell>{getRoleBadges(u.roles)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {u.gestor_name || '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {canEditRoleFor(u) && (
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  title="Editar papel"
                                  onClick={() => handleOpenEditRole(u)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                              {canResetPasswordFor(u) && u.id !== user?.id && (
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  title="Resetar senha"
                                  onClick={() => handleOpenResetPassword(u)}
                                >
                                  <KeyRound className="h-4 w-4" />
                                </Button>
                              )}
                              {canDeleteUserFor(u) && (
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  title="Excluir usuário"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleOpenDeleteUser(u)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Role Legend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Legenda de Papéis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="flex items-start gap-2">
                {getRoleBadge('admin')}
                <span className="text-muted-foreground">Acesso total, gerencia todo o sistema</span>
              </div>
              <div className="flex items-start gap-2">
                {getRoleBadge('gestor')}
                <span className="text-muted-foreground">Aprova dados, cria usuários, vê logs</span>
              </div>
              <div className="flex items-start gap-2">
                {getRoleBadge('editor')}
                <span className="text-muted-foreground">Preenche formulários, vê dashboards</span>
              </div>
              <div className="flex items-start gap-2">
                {getRoleBadge('leitor')}
                <span className="text-muted-foreground">Apenas visualiza e exporta dados</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Resetar Senha
            </DialogTitle>
            <DialogDescription>
              Definir nova senha temporária para <strong>{resetPasswordUser?.full_name || resetPasswordUser?.email}</strong>. 
              O usuário será obrigado a criar uma nova senha no próximo acesso.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha Temporária</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isResettingPassword}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordOpen(false)} disabled={isResettingPassword}>
              Cancelar
            </Button>
            <Button onClick={handleResetPassword} disabled={isResettingPassword}>
              {isResettingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <KeyRound className="h-4 w-4 mr-2" />}
              Resetar Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={editRoleOpen} onOpenChange={setEditRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Editar Papel
            </DialogTitle>
            <DialogDescription>
              Alterar o papel de <strong>{editRoleUser?.full_name || editRoleUser?.email}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Papel atual</Label>
              <div>{editRoleUser?.roles && getRoleBadges(editRoleUser.roles)}</div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRole">Novo Papel</Label>
              <Select 
                value={editSelectedRole} 
                onValueChange={(value: AppRole) => {
                  setEditSelectedRole(value);
                  if (value === 'admin' || value === 'gestor') setEditSelectedGestor('');
                }}
                disabled={isEditingRole}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o papel" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableRoles().map(role => (
                    <SelectItem key={role} value={role}>
                      {getRoleLabel(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {(editSelectedRole === 'editor' || editSelectedRole === 'leitor') && (
              <div className="space-y-2">
                <Label htmlFor="editGestor">Gestor Responsável</Label>
                <Select 
                  value={editSelectedGestor} 
                  onValueChange={setEditSelectedGestor}
                  disabled={isEditingRole}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o gestor" />
                  </SelectTrigger>
                  <SelectContent>
                    {gestores.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.full_name || g.email || 'Sem nome'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRoleOpen(false)} disabled={isEditingRole}>
              Cancelar
            </Button>
            <Button onClick={handleEditRole} disabled={isEditingRole}>
              {isEditingRole ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Pencil className="h-4 w-4 mr-2" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={deleteUserOpen} onOpenChange={setDeleteUserOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Excluir Usuário
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteUser?.full_name || deleteUser?.email}</strong>? 
              Esta ação não pode ser desfeita e o usuário perderá todo o acesso ao sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingUser}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser} 
              disabled={isDeletingUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingUser ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsers;
