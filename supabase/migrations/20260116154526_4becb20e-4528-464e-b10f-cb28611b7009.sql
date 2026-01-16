-- Drop the insecure public SELECT policy on candidates
DROP POLICY IF EXISTS "Anyone can read candidates for verification" ON public.candidates;

-- Create an admin-only SELECT policy for candidates table
CREATE POLICY "Admins can read candidates" 
  ON public.candidates 
  FOR SELECT 
  TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'::app_role));