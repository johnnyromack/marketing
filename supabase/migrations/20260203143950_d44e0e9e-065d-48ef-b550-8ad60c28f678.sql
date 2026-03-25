-- Create a secure view for user roles that hides hierarchy information from regular users
-- This view only exposes the minimum necessary data for non-admin users

CREATE OR REPLACE VIEW public.user_roles_safe
WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
  role,
  created_at,
  must_change_password,
  -- Only expose gestor_id to admins and the gestor themselves
  CASE 
    WHEN has_role(auth.uid(), 'admin') THEN gestor_id
    WHEN auth.uid() = gestor_id THEN gestor_id
    ELSE NULL
  END as gestor_id
FROM public.user_roles;

-- Grant access to the view
GRANT SELECT ON public.user_roles_safe TO authenticated;

-- Add comment explaining the view purpose
COMMENT ON VIEW public.user_roles_safe IS 'Secure view of user_roles that hides hierarchy (gestor_id) from unauthorized users to prevent organizational mapping attacks';