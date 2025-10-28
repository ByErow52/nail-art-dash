-- Remove public read access to admin_settings table
-- This prevents any authenticated user from viewing sensitive business configuration
DROP POLICY IF EXISTS "Anyone can view settings" ON public.admin_settings;