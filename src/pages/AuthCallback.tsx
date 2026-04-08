import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          navigate('/home', { replace: true });
          return;
        }
        console.error('exchangeCodeForSession error:', error);
        setErrorMsg(error.message);
        return;
      }

      // Sem code — volta para login
      navigate('/', { replace: true });
    };

    handleCallback();
  }, [navigate]);

  if (errorMsg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 p-4">
        <p className="text-destructive font-medium text-center">Erro no login com Google:</p>
        <p className="text-sm text-muted-foreground text-center max-w-md">{errorMsg}</p>
        <button onClick={() => navigate('/', { replace: true })} className="text-primary underline text-sm">
          Voltar ao login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
