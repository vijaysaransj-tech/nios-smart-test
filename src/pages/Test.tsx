import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { QuestionCard } from '@/components/QuestionCard';
import { TestTimer } from '@/components/TestTimer';
import { ProgressBar } from '@/components/ProgressBar';
import { useTestQuestions, useSaveQuestionResponse, useCompleteTestAttempt, useSections, Question } from '@/hooks/useDatabase';
import logo from '@/assets/logo.webp';

interface LocationState {
  attemptId: string;
  candidateId: string;
  candidateName: string;
}

interface QuestionWithSection extends Question {
  section_name: string;
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
  const { data: sections } = useSections();
  const saveQuestionResponse = useSaveQuestionResponse();
  const completeTestAttempt = useCompleteTestAttempt();

  useEffect(() => {
    if (!state?.attemptId) {
      navigate('/');
      return;
    }
    setStartTime(Date.now());
  }, [state, navigate]);

  const currentQuestion = questions?.[currentIndex] as QuestionWithSection | undefined;

  const moveToNextQuestion = useCallback(async () => {
    if (isTransitioning || !currentQuestion || !questions) return;
    
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;

    // Save response to database
    try {
      await saveQuestionResponse.mutateAsync({
        attempt_id: state.attemptId,
        question_id: currentQuestion.id,
        selected_answer: selectedAnswer || null,
        is_correct: isCorrect,
        time_taken: timeTaken,
      });

      // Track response locally for final calculation with more details
      const newResponse: ResponseData = {
        questionId: currentQuestion.id,
        isCorrect,
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
        // Test completed - calculate final scores
        finishTest([...responses, newResponse]);
      }
    } catch (error) {
      console.error('Failed to save response:', error);
    }
  }, [currentIndex, questions, selectedAnswer, currentQuestion, startTime, state?.attemptId, isTransitioning, responses]);

  const finishTest = async (allResponses: ResponseData[]) => {
    if (!questions || !sections) return;

    const correctAnswers = allResponses.filter(r => r.isCorrect).length;
    const incorrectAnswers = allResponses.filter(r => !r.isCorrect).length;

    try {
      const attempt = await completeTestAttempt.mutateAsync({
        attemptId: state.attemptId,
        correctAnswers,
        incorrectAnswers,
        totalQuestions: questions.length,
      });

      // Calculate section-wise scores
      const sectionScores = sections.map(section => {
        const sectionQuestions = questions.filter(q => q.section_id === section.id);
        const sectionResponses = allResponses.filter(r => 
          sectionQuestions.some(sq => sq.id === r.questionId)
        );
        const correct = sectionResponses.filter(r => r.isCorrect).length;
        return {
          sectionName: section.name,
          total: sectionQuestions.length,
          correct,
        };
      });

      // Build detailed question data for results page
      const detailedQuestions = questions.map(q => {
        const response = allResponses.find(r => r.questionId === q.id);
        return {
          id: q.id,
          question_text: q.question_text,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_answer: q.correct_answer,
          section_name: (q as QuestionWithSection).section_name,
          selected_answer: response?.selectedAnswer || null,
          is_correct: response?.isCorrect || false,
          time_taken: response?.timeTaken || 0,
        };
      });

      navigate('/result', { 
        state: { 
          attempt: {
            ...attempt,
            totalQuestions: questions.length,
            correctAnswers,
            incorrectAnswers,
          },
          sectionScores,
          candidateName: state.candidateName,
          detailedQuestions,
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

  // Transform question for QuestionCard component
  const questionForCard = {
    id: currentQuestion.id,
    sectionId: currentQuestion.section_id,
    questionText: currentQuestion.question_text,
    optionA: currentQuestion.option_a,
    optionB: currentQuestion.option_b,
    optionC: currentQuestion.option_c,
    optionD: currentQuestion.option_d,
    correctAnswer: currentQuestion.correct_answer as 'A' | 'B' | 'C' | 'D',
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
