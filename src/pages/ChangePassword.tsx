import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, KeyRound, AlertTriangle } from 'lucide-react';
import { ThemeLogo } from '@/components/ThemeLogo';

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  
  const { user, loading: authLoading, signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkPasswordStatus = async () => {
      if (!user) {
        setCheckingStatus(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('must_change_password')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking password status:', error);
      }

      setMustChangePassword(data?.must_change_password ?? false);
      setCheckingStatus(false);

      // If user doesn't need to change password, redirect to home
      if (data && !data.must_change_password) {
        navigate('/');
      }
    };

    if (!authLoading) {
      checkPasswordStatus();
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword) {
      toast({ title: 'Erro', description: 'Digite sua senha atual', variant: 'destructive' });
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast({ title: 'Erro', description: 'A nova senha deve ter pelo menos 6 caracteres', variant: 'destructive' });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: 'Erro', description: 'As senhas não coincidem', variant: 'destructive' });
      return;
    }

    if (currentPassword === newPassword) {
      toast({ title: 'Erro', description: 'A nova senha deve ser diferente da atual', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      // Verify current password using reauthentication (without triggering full auth state change)
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword
      });
      
      if (verifyError) {
        setIsLoading(false);
        toast({ 
          title: 'Erro', 
          description: 'Senha atual incorreta', 
          variant: 'destructive' 
        });
        return;
      }

      // Clear the must_change_password flag FIRST (before any redirect can happen)
      const { error: flagError } = await supabase
        .from('user_roles')
        .update({ must_change_password: false })
        .eq('user_id', user?.id);

      if (flagError) {
        console.error('Error clearing flag:', flagError);
        setIsLoading(false);
        toast({ 
          title: 'Erro', 
          description: 'Erro ao atualizar status. Tente novamente.', 
          variant: 'destructive' 
        });
        return;
      }

      // Update local state immediately to prevent re-render loop
      setMustChangePassword(false);

      // Now update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        // Rollback the flag if password update fails
        await supabase
          .from('user_roles')
          .update({ must_change_password: true })
          .eq('user_id', user?.id);
        setMustChangePassword(true);
        
        setIsLoading(false);
        toast({ 
          title: 'Erro ao atualizar senha', 
          description: updateError.message, 
          variant: 'destructive' 
        });
        return;
      }

      setIsLoading(false);
      toast({ 
        title: 'Senha alterada com sucesso!', 
        description: 'Você será redirecionado para o sistema' 
      });

      // Navigate to home after success
      setTimeout(() => {
        navigate('/home');
      }, 1000);
    } catch (error) {
      setIsLoading(false);
      toast({ 
        title: 'Erro', 
        description: 'Ocorreu um erro inesperado. Tente novamente.', 
        variant: 'destructive' 
      });
    }
  };

  if (authLoading || checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!mustChangePassword) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">

          <CardTitle className="flex items-center justify-center gap-2">
            <KeyRound className="h-5 w-5" />
            Criar Sua Senha
          </CardTitle>
          <CardDescription>
            Este é seu primeiro acesso. Por segurança, você precisa criar uma nova senha pessoal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-sm">
              Sua senha atual é temporária. Crie uma senha forte e memorável para proteger sua conta.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Senha Atual (Temporária)</Label>
              <Input
                id="current-password"
                type="password"
                placeholder="Digite a senha que você recebeu"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Digite novamente a nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <KeyRound className="h-4 w-4 mr-2" />}
              Salvar Nova Senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChangePassword;
