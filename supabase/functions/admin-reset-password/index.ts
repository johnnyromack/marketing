import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AppRole = 'admin' | 'gestor' | 'editor' | 'leitor';

interface ResetPasswordRequest {
  targetUserId: string;
  newPassword: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("No authorization header");
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    console.log("Creating user client...");
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the requesting user is authenticated
    const { data: { user: requestingUser }, error: authError } = await userClient.auth.getUser();
    if (authError || !requestingUser) {
      console.log("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Requesting user:", requestingUser.id);

    // Create admin client
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get requesting user's role
    const { data: requestingUserRoleData, error: requestingRoleError } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .maybeSingle();

    console.log("Requesting user role:", requestingUserRoleData);

    const requestingUserRole = requestingUserRoleData?.role as AppRole | null;
    const isAdmin = requestingUserRole === 'admin';
    const isGestor = requestingUserRole === 'gestor';

    if (!isAdmin && !isGestor) {
      return new Response(
        JSON.stringify({ error: "Acesso negado. Apenas administradores e gestores podem resetar senhas." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { targetUserId, newPassword }: ResetPasswordRequest = await req.json();
    console.log("Resetting password for user:", targetUserId);

    if (!targetUserId || !newPassword) {
      return new Response(
        JSON.stringify({ error: "ID do usuário e nova senha são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: "A senha deve ter pelo menos 6 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get target user's role
    const { data: targetUserRoleData, error: targetRoleError } = await adminClient
      .from('user_roles')
      .select('role, gestor_id')
      .eq('user_id', targetUserId)
      .maybeSingle();

    console.log("Target user role:", targetUserRoleData);

    const targetUserRole = targetUserRoleData?.role as AppRole | null;

    // Permission checks:
    // - Admin can reset anyone's password
    // - Gestor can only reset Editor and Leitor passwords (not Admin or other Gestors)
    if (isGestor && !isAdmin) {
      if (targetUserRole === 'admin') {
        return new Response(
          JSON.stringify({ error: "Gestores não podem alterar a senha de Administradores" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (targetUserRole === 'gestor') {
        return new Response(
          JSON.stringify({ error: "Gestores não podem alterar a senha de outros Gestores" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Gestor can only reset passwords of users they manage
      if (targetUserRoleData?.gestor_id !== requestingUser.id) {
        return new Response(
          JSON.stringify({ error: "Você só pode alterar a senha de usuários sob sua gestão" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Update the password
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      targetUserId,
      { password: newPassword }
    );

    if (updateError) {
      console.error("Error updating password:", updateError);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Password updated successfully");

    // Set must_change_password flag to true
    const { error: flagError } = await adminClient
      .from('user_roles')
      .update({ must_change_password: true })
      .eq('user_id', targetUserId);

    if (flagError) {
      console.error("Error setting flag:", flagError);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in admin-reset-password:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
