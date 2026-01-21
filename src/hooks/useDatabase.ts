import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types matching the database schema
export interface Section {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  created_at: string;
}

export interface Question {
  id: string;
  section_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  time_limit: number;
  created_at: string;
}

export interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  test_status: 'NOT_ATTEMPTED' | 'ATTEMPTED';
  created_at: string;
}

export interface TestAttempt {
  id: string;
  candidate_id: string;
  started_at: string;
  completed_at: string | null;
  total_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  total_score: number;
}

export interface QuestionResponse {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_answer: string | null;
  is_correct: boolean;
  time_taken: number;
  created_at: string;
}

export interface TestSettings {
  id: string;
  is_test_enabled: boolean;
  updated_at: string;
}

// Section hooks
export function useSections() {
  return useQuery({
    queryKey: ['sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sections')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as Section[];
    },
  });
}

export function useAddSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (section: { name: string; description?: string; display_order: number }) => {
      const { data, error } = await supabase
        .from('sections')
        .insert([section])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      toast.success('Section added successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to add section: ' + error.message);
    },
  });
}

export function useDeleteSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sections').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast.success('Section deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete section: ' + error.message);
    },
  });
}

// Question hooks
export function useQuestions() {
  return useQuery({
    queryKey: ['questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Question[];
    },
  });
}

export function useAddQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (question: Omit<Question, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('questions')
        .insert([question])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast.success('Question added successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to add question: ' + error.message);
    },
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('questions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast.success('Question deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete question: ' + error.message);
    },
  });
}

// Candidate hooks
export function useCandidates() {
  return useQuery({
    queryKey: ['candidates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Candidate[];
    },
  });
}

export interface VerifyCandidateResult {
  found: boolean;
  candidateId?: string;
  candidateName?: string;
  testStatus?: 'NOT_ATTEMPTED' | 'ATTEMPTED';
  message?: string;
}

export function useFindCandidate() {
  return useMutation({
    mutationFn: async ({ fullName, email, phone }: { fullName: string; email: string; phone: string }): Promise<VerifyCandidateResult> => {
      const { data, error } = await supabase.functions.invoke('verify-candidate', {
        body: { fullName, email, phone }
      });
      
      if (error) {
        console.error('Verification error:', error);
        throw new Error('Verification failed. Please try again.');
      }
      
      return data as VerifyCandidateResult;
    },
  });
}

export function useAddCandidate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (candidate: { full_name: string; email: string; phone: string }) => {
      const { data, error } = await supabase
        .from('candidates')
        .insert([{ ...candidate, test_status: 'NOT_ATTEMPTED' }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      toast.success('Candidate added successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to add candidate: ' + error.message);
    },
  });
}

export function useUpdateCandidateStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'NOT_ATTEMPTED' | 'ATTEMPTED' }) => {
      const { error } = await supabase
        .from('candidates')
        .update({ test_status: status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
    },
  });
}

export function useDeleteCandidate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('candidates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      toast.success('Candidate deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete candidate: ' + error.message);
    },
  });
}

// Test attempt hooks
export function useTestAttempts() {
  return useQuery({
    queryKey: ['test_attempts'],
    queryFn: async () => {
      // Admin users can use direct query, but for security we use edge function
      const { data, error } = await supabase
        .from('test_attempts')
        .select('*')
        .order('started_at', { ascending: false });
      if (error) throw error;
      return data as TestAttempt[];
    },
  });
}

export function useCreateTestAttempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ candidateId, totalQuestions }: { candidateId: string; totalQuestions: number }) => {
      const { data, error } = await supabase.functions.invoke('test-operations', {
        body: {
          action: 'create_attempt',
          candidateId,
          totalQuestions
        }
      });
      
      if (error) {
        console.error('Create attempt error:', error);
        throw new Error('Failed to create test attempt');
      }
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data as TestAttempt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test_attempts'] });
    },
  });
}

export function useCompleteTestAttempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ 
      attemptId, 
      correctAnswers, 
      incorrectAnswers,
      totalQuestions
    }: { 
      attemptId: string; 
      correctAnswers: number; 
      incorrectAnswers: number;
      totalQuestions: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('test-operations', {
        body: {
          action: 'complete_attempt',
          attemptId,
          correctAnswers,
          incorrectAnswers,
          totalQuestions
        }
      });
      
      if (error) {
        console.error('Complete attempt error:', error);
        throw new Error('Failed to complete test attempt');
      }
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data as TestAttempt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test_attempts'] });
    },
  });
}

// Question response hooks
export function useSaveQuestionResponse() {
  return useMutation({
    mutationFn: async (response: {
      attempt_id: string;
      question_id: string;
      selected_answer: string | null;
      is_correct: boolean;
      time_taken: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('test-operations', {
        body: {
          action: 'save_response',
          attemptId: response.attempt_id,
          questionId: response.question_id,
          selectedAnswer: response.selected_answer,
          isCorrect: response.is_correct,
          timeTaken: response.time_taken
        }
      });
      
      if (error) {
        console.error('Save response error:', error);
        throw new Error('Failed to save response');
      }
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data;
    },
  });
}

export function useQuestionResponses(attemptId: string) {
  return useQuery({
    queryKey: ['question_responses', attemptId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('test-operations', {
        body: {
          action: 'get_responses',
          attemptId
        }
      });
      
      if (error) {
        console.error('Get responses error:', error);
        throw new Error('Failed to get responses');
      }
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data as QuestionResponse[];
    },
    enabled: !!attemptId,
  });
}

// Test settings hooks
export function useTestSettings() {
  return useQuery({
    queryKey: ['test_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('test_settings')
        .select('*')
        .limit(1)
        .single();
      if (error) throw error;
      return data as TestSettings;
    },
  });
}

export function useUpdateTestSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ isTestEnabled }: { isTestEnabled: boolean }) => {
      const { data: existing } = await supabase
        .from('test_settings')
        .select('id')
        .limit(1)
        .single();
      
      if (existing) {
        const { error } = await supabase
          .from('test_settings')
          .update({ is_test_enabled: isTestEnabled, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test_settings'] });
      toast.success('Settings updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update settings: ' + error.message);
    },
  });
}

// Get all test questions with section info
export function useTestQuestions() {
  return useQuery({
    queryKey: ['test_questions'],
    queryFn: async () => {
      const { data: sections, error: sectionsError } = await supabase
        .from('sections')
        .select('*')
        .order('display_order', { ascending: true });
      if (sectionsError) throw sectionsError;

      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: true });
      if (questionsError) throw questionsError;

      // Combine questions with section info, ordered by section display order
      const allQuestions: Array<Question & { section_name: string }> = [];
      (sections as Section[]).forEach(section => {
        const sectionQuestions = (questions as Question[]).filter(q => q.section_id === section.id);
        sectionQuestions.forEach(q => {
          allQuestions.push({ ...q, section_name: section.name });
        });
      });

      return allQuestions;
    },
  });
}
