-- Fix Security Issues in RLS Policies

-- 1. FIX: fornecedores_contact_data_exposure
-- Change SELECT policy from "true" (all authenticated) to only admin/gestor/editor
DROP POLICY IF EXISTS "Authenticated users can view suppliers" ON fornecedores;

CREATE POLICY "Admins, gestors and editors can view suppliers" 
ON fornecedores 
FOR SELECT 
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'gestor'::app_role, 'editor'::app_role]));

-- 2. FIX: campanhas_budget_exposure
-- Remove the overly permissive "Users can view approved campanhas" policy
-- Only campaign owners, their gestors, leitores, and admins should see campaigns
DROP POLICY IF EXISTS "Users can view approved campanhas" ON campanhas;

-- Leitores already have a policy to view approved campaigns which is appropriate for their read-only role
-- The issue is the "Users can view approved campanhas" that allows ANY authenticated user to see all approved campaigns

-- 3. FIX: marcas_unrestricted_modification
-- Change DELETE policy to admin only (currently allows editors to delete)
DROP POLICY IF EXISTS "Admins and editors can delete marcas" ON marcas;

CREATE POLICY "Admins can delete marcas" 
ON marcas 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Also fix INSERT and UPDATE to include gestor role for consistency
DROP POLICY IF EXISTS "Admins and editors can insert marcas" ON marcas;
DROP POLICY IF EXISTS "Admins and editors can update marcas" ON marcas;

CREATE POLICY "Admins gestors and editors can insert marcas" 
ON marcas 
FOR INSERT 
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'gestor'::app_role, 'editor'::app_role]));

CREATE POLICY "Admins gestors and editors can update marcas" 
ON marcas 
FOR UPDATE 
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'gestor'::app_role, 'editor'::app_role]));

-- 4. FIX: Similar issue with unidades table - editors can delete
DROP POLICY IF EXISTS "Admins and editors can delete unidades" ON unidades;

CREATE POLICY "Admins can delete unidades" 
ON unidades 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Also fix unidades INSERT and UPDATE to include gestor
DROP POLICY IF EXISTS "Admins and editors can insert unidades" ON unidades;
DROP POLICY IF EXISTS "Admins and editors can update unidades" ON unidades;

CREATE POLICY "Admins gestors and editors can insert unidades" 
ON unidades 
FOR INSERT 
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'gestor'::app_role, 'editor'::app_role]));

CREATE POLICY "Admins gestors and editors can update unidades" 
ON unidades 
FOR UPDATE 
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'gestor'::app_role, 'editor'::app_role]));

-- 5. FIX: tipos_custo - same pattern, restrict delete to admin only
DROP POLICY IF EXISTS "Admins can delete tipos_custo" ON tipos_custo;

-- Already admin only, but let's also add gestor to insert/update for consistency
DROP POLICY IF EXISTS "Admins and editors can insert tipos_custo" ON tipos_custo;
DROP POLICY IF EXISTS "Admins and editors can update tipos_custo" ON tipos_custo;

CREATE POLICY "Admins can delete tipos_custo" 
ON tipos_custo 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins gestors and editors can insert tipos_custo" 
ON tipos_custo 
FOR INSERT 
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'gestor'::app_role, 'editor'::app_role]));

CREATE POLICY "Admins gestors and editors can update tipos_custo" 
ON tipos_custo 
FOR UPDATE 
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'gestor'::app_role, 'editor'::app_role]));