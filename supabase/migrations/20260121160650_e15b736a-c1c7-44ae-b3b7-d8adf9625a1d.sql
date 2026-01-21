-- Fix 1: Protect correct_answer in questions table
-- Drop the permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can read questions" ON public.questions;

-- Create admin-only SELECT policy for full question access
CREATE POLICY "Admins can read all questions" ON public.questions
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create a secure view for public test-taking (excludes correct_answer)
CREATE OR REPLACE VIEW public.questions_public AS
SELECT id, section_id, question_text, option_a, option_b, option_c, option_d, time_limit, created_at
FROM public.questions;

-- Grant access to the view
GRANT SELECT ON public.questions_public TO anon, authenticated;

-- Fix 2: Remove insecure UPDATE policy on candidates
DROP POLICY IF EXISTS "Anyone can update candidate status" ON public.candidates;

-- Create admin-only UPDATE policy for candidates
CREATE POLICY "Admins can update candidates" ON public.candidates
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));