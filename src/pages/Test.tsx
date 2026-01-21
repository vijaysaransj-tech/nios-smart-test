import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { QuestionCard } from '@/components/QuestionCard';
import { TestTimer } from '@/components/TestTimer';
import { ProgressBar } from '@/components/ProgressBar';
import { useTestQuestions, useSaveQuestionResponse, useCompleteTestAttempt, useGetTestResults } from '@/hooks/useDatabase';
import logo from '@/assets/logo.webp';

interface LocationState {
  attemptId: string;
  candidateId: string;
  candidateName: string;
}

interface ResponseData {
  questionId: string;
  isCorrect: boolean;
  selectedAnswer: string | null;
  timeTaken: number;
}

export default function Test() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | undefined>();
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [responses, setResponses] = useState<ResponseData[]>([]);

  const { data: questions, isLoading } = useTestQuestions();
  const saveQuestionResponse = useSaveQuestionResponse();
  const completeTestAttempt = useCompleteTestAttempt();
  const getTestResults = useGetTestResults();

  useEffect(() => {
    if (!state?.attemptId) {
      navigate('/');
      return;
    }
    setStartTime(Date.now());
  }, [state, navigate]);

  const currentQuestion = questions?.[currentIndex];

  const moveToNextQuestion = useCallback(async () => {
    if (isTransitioning || !currentQuestion || !questions) return;
    
    const timeTaken = Math.round((Date.now() - startTime) / 1000);

    // Save response to database - server validates the answer
    try {
      const response = await saveQuestionResponse.mutateAsync({
        attempt_id: state.attemptId,
        question_id: currentQuestion.id,
        selected_answer: selectedAnswer || null,
        time_taken: timeTaken,
      });

      // Track response locally using server-validated result
      const newResponse: ResponseData = {
        questionId: currentQuestion.id,
        isCorrect: response.is_correct,
        selectedAnswer: selectedAnswer || null,
        timeTaken,
      };
      
      setResponses(prev => [...prev, newResponse]);

      if (currentIndex < questions.length - 1) {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
          setSelectedAnswer(undefined);
          setStartTime(Date.now());
          setIsTransitioning(false);
        }, 300);
      } else {
        // Test completed - fetch results from server
        finishTest();
      }
    } catch (error) {
      console.error('Failed to save response:', error);
    }
  }, [currentIndex, questions, selectedAnswer, currentQuestion, startTime, state?.attemptId, isTransitioning]);

  const finishTest = async () => {
    try {
      // Complete the attempt (server calculates scores)
      await completeTestAttempt.mutateAsync({
        attemptId: state.attemptId,
      });

      // Fetch complete results including correct answers from server
      const results = await getTestResults.mutateAsync({
        attemptId: state.attemptId,
      });

      navigate('/result', { 
        state: { 
          attempt: {
            ...results.attempt,
            totalQuestions: results.attempt.total_questions,
            correctAnswers: results.attempt.correct_answers,
            incorrectAnswers: results.attempt.incorrect_answers,
          },
          sectionScores: results.sectionScores,
          candidateName: state.candidateName,
          detailedQuestions: results.detailedQuestions,
        } 
      });
    } catch (error) {
      console.error('Failed to complete test:', error);
    }
  };

  const handleSelectAnswer = (answer: 'A' | 'B' | 'C' | 'D') => {
    if (isTransitioning) return;
    setSelectedAnswer(answer);
    // Auto-advance after a short delay
    setTimeout(() => {
      moveToNextQuestion();
    }, 500);
  };

  const handleTimeUp = useCallback(() => {
    moveToNextQuestion();
  }, [moveToNextQuestion]);

  if (isLoading || !currentQuestion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-muted-foreground">Loading questions...</p>
        </div>
      </div>
    );
  }

  // Transform question for QuestionCard component (without correct_answer for security)
  const questionForCard = {
    id: currentQuestion.id,
    sectionId: currentQuestion.section_id,
    questionText: currentQuestion.question_text,
    optionA: currentQuestion.option_a,
    optionB: currentQuestion.option_b,
    optionC: currentQuestion.option_c,
    optionD: currentQuestion.option_d,
    correctAnswer: 'A' as 'A' | 'B' | 'C' | 'D', // Placeholder - not used during test
    timeLimit: currentQuestion.time_limit,
    createdAt: new Date(currentQuestion.created_at),
    sectionName: currentQuestion.section_name,
    questionNumber: currentIndex + 1,
    totalQuestions: questions?.length || 0,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <img src={logo} alt="ThinkerZ Hub" className="h-10 object-contain" />
          <div className="text-sm text-muted-foreground">
            {state?.candidateName}
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <ProgressBar current={currentIndex + 1} total={questions?.length || 0} />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
            {/* Timer */}
            <motion.div
              className="flex justify-center md:justify-start"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <TestTimer
                key={currentQuestion.id}
                timeLimit={currentQuestion.time_limit}
                onTimeUp={handleTimeUp}
                isPaused={isTransitioning}
              />
            </motion.div>
          </div>

          {/* Question Card */}
          <AnimatePresence mode="wait">
            <QuestionCard
              key={currentQuestion.id}
              question={questionForCard}
              selectedAnswer={selectedAnswer}
              onSelectAnswer={handleSelectAnswer}
            />
          </AnimatePresence>

          {/* Instruction */}
          <motion.p
            className="text-center text-sm text-muted-foreground mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Click on an option to submit and move to the next question
          </motion.p>
        </div>
      </main>
    </div>
  );
}
