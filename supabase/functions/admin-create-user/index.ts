import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AppRole = 'admin' | 'gestor' | 'editor' | 'leitor';

interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  role: AppRole;
  gestorId?: string;
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

    // Create Supabase client with user's token
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

    // Check if requesting user is admin or gestor using service role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: roleData, error: roleError } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .maybeSingle();

    console.log("Role check result:", roleData, roleError);

    const requestingUserRole = roleData?.role as AppRole | null;
    const isAdmin = requestingUserRole === 'admin';
    const isGestor = requestingUserRole === 'gestor';

    if (!isAdmin && !isGestor) {
      return new Response(
        JSON.stringify({ error: "Acesso negado. Apenas administradores e gestores podem criar usuários." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { email, password, fullName, role, gestorId }: CreateUserRequest = await req.json();
    console.log("Creating user:", { email, fullName, role, gestorId });

    if (!email || !password || !fullName) {
      return new Response(
        JSON.stringify({ error: "Email, senha e nome são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate role permissions
    // Admin can create any role
    // Gestor can create: gestor, editor, leitor (not admin)
    if (isGestor && role === 'admin') {
      return new Response(
        JSON.stringify({ error: "Gestores não podem criar usuários com papel de Administrador" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the new user using admin client
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });

    if (createError) {
      console.error("Error creating user:", createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User created:", newUser.user.id);

    // Assign role to the new user with optional gestor_id
    // Editor and Leitor need a gestor_id
    // All new users must change password on first login
    const roleInsertData: { user_id: string; role: string; gestor_id?: string; must_change_password: boolean } = { 
      user_id: newUser.user.id, 
      role,
      must_change_password: true
    };
    
    // If creating editor or leitor, assign the gestor_id
    if ((role === 'editor' || role === 'leitor') && gestorId) {
      roleInsertData.gestor_id = gestorId;
    }

    const { error: roleInsertError } = await adminClient
      .from('user_roles')
      .insert(roleInsertData);

    if (roleInsertError) {
      console.error("Error assigning role:", roleInsertError);
      // User was created but role assignment failed
      return new Response(
        JSON.stringify({ 
          warning: "Usuário criado, mas houve erro ao atribuir o papel",
          user: newUser.user 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Role assigned successfully");

    return new Response(
      JSON.stringify({ success: true, user: newUser.user }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in admin-create-user:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
