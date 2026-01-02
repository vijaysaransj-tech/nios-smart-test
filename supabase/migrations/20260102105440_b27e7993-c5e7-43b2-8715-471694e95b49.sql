-- Create enum for test status
CREATE TYPE public.test_status AS ENUM ('NOT_ATTEMPTED', 'ATTEMPTED');

-- Create sections table
CREATE TABLE public.sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create questions table
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  time_limit INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create candidates table
CREATE TABLE public.candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  test_status public.test_status NOT NULL DEFAULT 'NOT_ATTEMPTED',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(email, phone)
);

-- Create test_attempts table
CREATE TABLE public.test_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  total_questions INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  incorrect_answers INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0
);

-- Create question_responses table
CREATE TABLE public.question_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID NOT NULL REFERENCES public.test_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_answer TEXT,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  time_taken INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create test_settings table
CREATE TABLE public.test_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_test_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default test settings
INSERT INTO public.test_settings (is_test_enabled) VALUES (true);

-- Create admin_roles table for secure admin authentication
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on all tables
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for sections (public read, admin write)
CREATE POLICY "Anyone can read sections" ON public.sections FOR SELECT USING (true);
CREATE POLICY "Admins can insert sections" ON public.sections FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update sections" ON public.sections FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete sections" ON public.sections FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for questions (public read, admin write)
CREATE POLICY "Anyone can read questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Admins can insert questions" ON public.questions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update questions" ON public.questions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete questions" ON public.questions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for candidates (public read for verification, admin full access)
CREATE POLICY "Anyone can read candidates for verification" ON public.candidates FOR SELECT USING (true);
CREATE POLICY "Anyone can update candidate status" ON public.candidates FOR UPDATE USING (true);
CREATE POLICY "Admins can insert candidates" ON public.candidates FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete candidates" ON public.candidates FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for test_attempts (public insert/read for test takers, admin full access)
CREATE POLICY "Anyone can read test attempts" ON public.test_attempts FOR SELECT USING (true);
CREATE POLICY "Anyone can insert test attempts" ON public.test_attempts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update test attempts" ON public.test_attempts FOR UPDATE USING (true);

-- RLS Policies for question_responses (public insert/read for test takers)
CREATE POLICY "Anyone can read question responses" ON public.question_responses FOR SELECT USING (true);
CREATE POLICY "Anyone can insert question responses" ON public.question_responses FOR INSERT WITH CHECK (true);

-- RLS Policies for test_settings (public read, admin write)
CREATE POLICY "Anyone can read test settings" ON public.test_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update test settings" ON public.test_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes for better performance
CREATE INDEX idx_questions_section_id ON public.questions(section_id);
CREATE INDEX idx_test_attempts_candidate_id ON public.test_attempts(candidate_id);
CREATE INDEX idx_question_responses_attempt_id ON public.question_responses(attempt_id);
CREATE INDEX idx_candidates_email_phone ON public.candidates(email, phone);

-- Insert demo data for sections
INSERT INTO public.sections (name, description, display_order) VALUES
  ('Mathematics', 'Basic math concepts', 1),
  ('Science', 'General science questions', 2),
  ('English', 'Grammar and comprehension', 3);

-- Insert demo questions
INSERT INTO public.questions (section_id, question_text, option_a, option_b, option_c, option_d, correct_answer, time_limit) 
SELECT s.id, 'What is 15 × 8?', '110', '120', '130', '140', 'B', 30 FROM public.sections s WHERE s.name = 'Mathematics'
UNION ALL
SELECT s.id, 'If x + 5 = 12, what is the value of x?', '5', '6', '7', '8', 'C', 30 FROM public.sections s WHERE s.name = 'Mathematics'
UNION ALL
SELECT s.id, 'What is the square root of 144?', '10', '11', '12', '13', 'C', 25 FROM public.sections s WHERE s.name = 'Mathematics'
UNION ALL
SELECT s.id, 'What is the chemical formula for water?', 'H2O', 'CO2', 'NaCl', 'O2', 'A', 20 FROM public.sections s WHERE s.name = 'Science'
UNION ALL
SELECT s.id, 'Which planet is known as the Red Planet?', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'B', 20 FROM public.sections s WHERE s.name = 'Science'
UNION ALL
SELECT s.id, 'What is the process by which plants make food?', 'Respiration', 'Digestion', 'Photosynthesis', 'Fermentation', 'C', 25 FROM public.sections s WHERE s.name = 'Science'
UNION ALL
SELECT s.id, 'Choose the correct spelling:', 'Accomodation', 'Accommodation', 'Acomodation', 'Acommodation', 'B', 20 FROM public.sections s WHERE s.name = 'English'
UNION ALL
SELECT s.id, 'What is the past tense of "run"?', 'Runned', 'Running', 'Ran', 'Runs', 'C', 20 FROM public.sections s WHERE s.name = 'English';

-- Insert demo candidates
INSERT INTO public.candidates (full_name, email, phone) VALUES
  ('Rahul Sharma', 'rahul@example.com', '9876543210'),
  ('Priya Patel', 'priya@example.com', '9876543211');