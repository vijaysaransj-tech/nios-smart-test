// In-memory store for demo purposes
// This will be replaced with Supabase once Cloud is enabled

import { Section, Question, Candidate, TestAttempt, QuestionResponse, TestSettings } from './types';

// Demo data
const demoSections: Section[] = [
  { id: '1', name: 'Mathematics', description: 'Basic math concepts', displayOrder: 1, createdAt: new Date() },
  { id: '2', name: 'Science', description: 'General science questions', displayOrder: 2, createdAt: new Date() },
  { id: '3', name: 'English', description: 'Grammar and comprehension', displayOrder: 3, createdAt: new Date() },
];

const demoQuestions: Question[] = [
  { id: '1', sectionId: '1', questionText: 'What is 15 × 8?', optionA: '110', optionB: '120', optionC: '130', optionD: '140', correctAnswer: 'B', timeLimit: 30, createdAt: new Date() },
  { id: '2', sectionId: '1', questionText: 'If x + 5 = 12, what is the value of x?', optionA: '5', optionB: '6', optionC: '7', optionD: '8', correctAnswer: 'C', timeLimit: 30, createdAt: new Date() },
  { id: '3', sectionId: '1', questionText: 'What is the square root of 144?', optionA: '10', optionB: '11', optionC: '12', optionD: '13', correctAnswer: 'C', timeLimit: 25, createdAt: new Date() },
  { id: '4', sectionId: '2', questionText: 'What is the chemical formula for water?', optionA: 'H2O', optionB: 'CO2', optionC: 'NaCl', optionD: 'O2', correctAnswer: 'A', timeLimit: 20, createdAt: new Date() },
  { id: '5', sectionId: '2', questionText: 'Which planet is known as the Red Planet?', optionA: 'Venus', optionB: 'Mars', optionC: 'Jupiter', optionD: 'Saturn', correctAnswer: 'B', timeLimit: 20, createdAt: new Date() },
  { id: '6', sectionId: '2', questionText: 'What is the process by which plants make food?', optionA: 'Respiration', optionB: 'Digestion', optionC: 'Photosynthesis', optionD: 'Fermentation', correctAnswer: 'C', timeLimit: 25, createdAt: new Date() },
  { id: '7', sectionId: '3', questionText: 'Choose the correct spelling:', optionA: 'Accomodation', optionB: 'Accommodation', optionC: 'Acomodation', optionD: 'Acommodation', correctAnswer: 'B', timeLimit: 20, createdAt: new Date() },
  { id: '8', sectionId: '3', questionText: 'What is the past tense of "run"?', optionA: 'Runned', optionB: 'Running', optionC: 'Ran', optionD: 'Runs', correctAnswer: 'C', timeLimit: 20, createdAt: new Date() },
];

const demoCandidates: Candidate[] = [
  { id: '1', fullName: 'Rahul Sharma', email: 'rahul@example.com', phone: '9876543210', testStatus: 'NOT_ATTEMPTED', createdAt: new Date() },
  { id: '2', fullName: 'Priya Patel', email: 'priya@example.com', phone: '9876543211', testStatus: 'NOT_ATTEMPTED', createdAt: new Date() },
];

// Store state
let sections: Section[] = [...demoSections];
let questions: Question[] = [...demoQuestions];
let candidates: Candidate[] = [...demoCandidates];
let testAttempts: TestAttempt[] = [];
let questionResponses: QuestionResponse[] = [];
let testSettings: TestSettings = { isTestEnabled: true };

// Section operations
export const getSections = () => [...sections].sort((a, b) => a.displayOrder - b.displayOrder);
export const addSection = (section: Omit<Section, 'id' | 'createdAt'>) => {
  const newSection = { ...section, id: Date.now().toString(), createdAt: new Date() };
  sections.push(newSection);
  return newSection;
};
export const updateSection = (id: string, updates: Partial<Section>) => {
  sections = sections.map(s => s.id === id ? { ...s, ...updates } : s);
};
export const deleteSection = (id: string) => {
  sections = sections.filter(s => s.id !== id);
  questions = questions.filter(q => q.sectionId !== id);
};

// Question operations
export const getQuestions = () => [...questions];
export const getQuestionsBySection = (sectionId: string) => questions.filter(q => q.sectionId === sectionId);
export const addQuestion = (question: Omit<Question, 'id' | 'createdAt'>) => {
  const newQuestion = { ...question, id: Date.now().toString(), createdAt: new Date() };
  questions.push(newQuestion);
  return newQuestion;
};
export const updateQuestion = (id: string, updates: Partial<Question>) => {
  questions = questions.map(q => q.id === id ? { ...q, ...updates } : q);
};
export const deleteQuestion = (id: string) => {
  questions = questions.filter(q => q.id !== id);
};

// Candidate operations
export const getCandidates = () => [...candidates];
export const findCandidate = (name: string, email: string, phone: string) => {
  return candidates.find(c => 
    c.fullName.toLowerCase() === name.toLowerCase() &&
    c.email.toLowerCase() === email.toLowerCase() &&
    c.phone === phone
  );
};
export const addCandidate = (candidate: Omit<Candidate, 'id' | 'createdAt' | 'testStatus'>) => {
  const newCandidate = { ...candidate, id: Date.now().toString(), testStatus: 'NOT_ATTEMPTED' as const, createdAt: new Date() };
  candidates.push(newCandidate);
  return newCandidate;
};
export const updateCandidateStatus = (id: string, status: Candidate['testStatus']) => {
  candidates = candidates.map(c => c.id === id ? { ...c, testStatus: status } : c);
};
export const deleteCandidate = (id: string) => {
  candidates = candidates.filter(c => c.id !== id);
};

// Test attempt operations
export const createTestAttempt = (candidateId: string): TestAttempt => {
  const attempt: TestAttempt = {
    id: Date.now().toString(),
    candidateId,
    startedAt: new Date(),
    totalScore: 0,
    totalQuestions: questions.length,
    correctAnswers: 0,
    incorrectAnswers: 0,
  };
  testAttempts.push(attempt);
  return attempt;
};

export const completeTestAttempt = (attemptId: string, results: { correctAnswers: number; incorrectAnswers: number }) => {
  testAttempts = testAttempts.map(a => 
    a.id === attemptId 
      ? { 
          ...a, 
          completedAt: new Date(), 
          correctAnswers: results.correctAnswers,
          incorrectAnswers: results.incorrectAnswers,
          totalScore: Math.round((results.correctAnswers / a.totalQuestions) * 100)
        } 
      : a
  );
  return testAttempts.find(a => a.id === attemptId);
};

export const getTestAttempts = () => [...testAttempts];
export const getAttemptByCandidate = (candidateId: string) => testAttempts.find(a => a.candidateId === candidateId);

// Question response operations
export const saveQuestionResponse = (response: Omit<QuestionResponse, 'id'>) => {
  const newResponse = { ...response, id: Date.now().toString() };
  questionResponses.push(newResponse);
  return newResponse;
};

export const getResponsesByAttempt = (attemptId: string) => questionResponses.filter(r => r.attemptId === attemptId);

// Test settings
export const getTestSettings = () => ({ ...testSettings });
export const updateTestSettings = (updates: Partial<TestSettings>) => {
  testSettings = { ...testSettings, ...updates };
};

// Get all questions for test
export const getTestQuestions = () => {
  const orderedSections = getSections();
  const allQuestions: (Question & { sectionName: string })[] = [];
  
  orderedSections.forEach(section => {
    const sectionQuestions = getQuestionsBySection(section.id);
    sectionQuestions.forEach(q => {
      allQuestions.push({ ...q, sectionName: section.name });
    });
  });
  
  return allQuestions;
};
