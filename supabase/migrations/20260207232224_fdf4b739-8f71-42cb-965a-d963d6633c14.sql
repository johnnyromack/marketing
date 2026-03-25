-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view approved orcamentos" ON public.orcamentos;

-- Create more restrictive policy: users can only see their own budgets or if they are admin/gestor
CREATE POLICY "Users can view own or managed orcamentos"
ON public.orcamentos
FOR SELECT
TO authenticated
USING (
  -- Users can see their own budgets
  user_id = auth.uid()
  -- Admins can see all budgets
  OR public.has_role(auth.uid(), 'admin')
  -- Gestors can see budgets from their subordinates
  OR (
    public.has_role(auth.uid(), 'gestor')
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.gestor_id = auth.uid()
      AND user_roles.user_id = orcamentos.user_id
    )
  )
);