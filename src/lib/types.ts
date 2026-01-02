// Core types for ThinkerzHub NIOS Admission Test

export interface Section {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  createdAt: Date;
}

export interface Question {
  id: string;
  sectionId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  timeLimit: number; // in seconds
  createdAt: Date;
}

export type TestStatus = 'NOT_ATTEMPTED' | 'ATTEMPTED';

export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  testStatus: TestStatus;
  createdAt: Date;
}

export interface TestAttempt {
  id: string;
  candidateId: string;
  startedAt: Date;
  completedAt?: Date;
  totalScore: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
}

export interface QuestionResponse {
  id: string;
  attemptId: string;
  questionId: string;
  selectedAnswer?: 'A' | 'B' | 'C' | 'D';
  isCorrect: boolean;
  timeTaken: number; // in seconds
}

export interface TestSettings {
  isTestEnabled: boolean;
  testStartTime?: Date;
  testEndTime?: Date;
}

// For the test interface
export interface QuestionWithSection extends Question {
  sectionName: string;
  questionNumber: number;
  totalQuestions: number;
}
