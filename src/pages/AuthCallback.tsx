import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      // PKCE flow: Supabase redirects with ?code=
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (data.session) {
          navigate('/home', { replace: true });
        } else {
          console.error('OAuth callback error:', error);
          navigate('/?error=oauth', { replace: true });
        }
        return;
      }

      // Implicit flow: check if session already exists in hash
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/home', { replace: true });
      } else {
        navigate('/?error=oauth', { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
