-- Drop existing insecure policies on test_attempts
DROP POLICY IF EXISTS "Anyone can read test attempts" ON public.test_attempts;
DROP POLICY IF EXISTS "Anyone can insert test attempts" ON public.test_attempts;
DROP POLICY IF EXISTS "Anyone can update test attempts" ON public.test_attempts;

-- Drop existing insecure policies on question_responses
DROP POLICY IF EXISTS "Anyone can insert question responses" ON public.question_responses;
DROP POLICY IF EXISTS "Anyone can read question responses" ON public.question_responses;

-- Create secure policies for test_attempts (admin only for direct access)
CREATE POLICY "Admins can read test attempts"
  ON public.test_attempts FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert test attempts"
  ON public.test_attempts FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update test attempts"
  ON public.test_attempts FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create secure policies for question_responses (admin only for direct access)
CREATE POLICY "Admins can read question responses"
  ON public.question_responses FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert question responses"
  ON public.question_responses FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));