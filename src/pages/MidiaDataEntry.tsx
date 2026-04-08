import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { AppLayout } from '@/components/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { MidiaOnForm } from '@/components/midia/MidiaOnForm';
import { MidiaOffForm } from '@/components/midia/MidiaOffForm';
import { EventosForm } from '@/components/midia/EventosForm';
import { BrindesForm } from '@/components/midia/BrindesForm';
import { useToast } from '@/hooks/use-toast';

const MidiaDataEntry = () => {
  const { user, loading: authLoading } = useAuth();
  const { canEditForms, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('midia-on');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Check access permission
  useEffect(() => {
    if (!roleLoading && user && !canEditForms) {
      toast({ title: 'Acesso negado', description: 'Você não tem permissão para editar dados', variant: 'destructive' });
      navigate('/');
    }
  }, [canEditForms, roleLoading, user, navigate, toast]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AppLayout>
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Cadastro de Mídia</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="midia-on">Mídia On</TabsTrigger>
            <TabsTrigger value="midia-off">Mídia Off</TabsTrigger>
            <TabsTrigger value="eventos">Eventos</TabsTrigger>
            <TabsTrigger value="brindes">Brindes</TabsTrigger>
          </TabsList>

          <TabsContent value="midia-on">
            <MidiaOnForm />
          </TabsContent>

          <TabsContent value="midia-off">
            <MidiaOffForm />
          </TabsContent>

          <TabsContent value="eventos">
            <EventosForm />
          </TabsContent>

          <TabsContent value="brindes">
            <BrindesForm />
          </TabsContent>
        </Tabs>
      </main>
    </AppLayout>
  );
};

export default MidiaDataEntry;
