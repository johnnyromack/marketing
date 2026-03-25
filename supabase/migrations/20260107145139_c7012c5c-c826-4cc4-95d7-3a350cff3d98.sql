-- Insert profiles for existing users from user_roles that don't have profiles yet
INSERT INTO public.profiles (id, email, full_name)
SELECT 
  ur.user_id,
  COALESCE(
    (SELECT email FROM auth.users WHERE id = ur.user_id),
    'unknown@email.com'
  ),
  COALESCE(
    (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = ur.user_id),
    'Usuário'
  )
FROM public.user_roles ur
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = ur.user_id
);

-- Create or replace the trigger function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();