-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow gestors to view profiles of their subordinates
CREATE POLICY "Gestors can view subordinate profiles"
ON public.profiles
FOR SELECT
USING (
  public.has_role(auth.uid(), 'gestor'::app_role) 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = profiles.id 
    AND user_roles.gestor_id = auth.uid()
  )
);