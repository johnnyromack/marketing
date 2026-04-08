import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // With implicit flow, detectSessionInUrl: true automatically processes
    // the #access_token= hash and fires onAuthStateChange(SIGNED_IN).
    // We just wait for it and navigate accordingly.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/home', { replace: true });
      }
    });

    // Check if session was already set by detectSessionInUrl before our effect ran
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/home', { replace: true });
      }
    });

    // Fallback: if nothing happens in 6 seconds, go back to login
    const timeout = setTimeout(() => {
      navigate('/', { replace: true });
    }, 6000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
