import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { QuestionCard } from '@/components/QuestionCard';
import { TestTimer } from '@/components/TestTimer';
import { ProgressBar } from '@/components/ProgressBar';
import { getTestQuestions, saveQuestionResponse, completeTestAttempt, getResponsesByAttempt, getSections } from '@/lib/store';
import { QuestionWithSection } from '@/lib/types';

interface LocationState {
  attemptId: string;
  candidateId: string;
  candidateName: string;
}

export default function Test() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const [questions, setQuestions] = useState<QuestionWithSection[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | undefined>();
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (!state?.attemptId) {
      navigate('/');
      return;
    }

    const allQuestions = getTestQuestions();
    const questionsWithNumbers = allQuestions.map((q, index) => ({
      ...q,
      questionNumber: index + 1,
      totalQuestions: allQuestions.length,
    }));
    setQuestions(questionsWithNumbers);
    setStartTime(Date.now());
  }, [state, navigate]);

  const currentQuestion = questions[currentIndex];

  const moveToNextQuestion = useCallback(() => {
    if (isTransitioning) return;
    
    const timeTaken = Math.round((Date.now() - startTime) / 1000);

    // Save response
    if (currentQuestion) {
      saveQuestionResponse({
        attemptId: state.attemptId,
        questionId: currentQuestion.id,
        selectedAnswer: selectedAnswer,
        isCorrect: selectedAnswer === currentQuestion.correctAnswer,
        timeTaken,
      });
    }

    if (currentIndex < questions.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setSelectedAnswer(undefined);
        setStartTime(Date.now());
        setIsTransitioning(false);
      }, 300);
    } else {
      // Test completed
      finishTest();
    }
  }, [currentIndex, questions.length, selectedAnswer, currentQuestion, startTime, state?.attemptId, isTransitioning]);

  const finishTest = () => {
    const responses = getResponsesByAttempt(state.attemptId);
    const correctAnswers = responses.filter(r => r.isCorrect).length;
    const incorrectAnswers = responses.filter(r => !r.isCorrect).length;

    const attempt = completeTestAttempt(state.attemptId, { correctAnswers, incorrectAnswers });

    // Calculate section-wise scores
    const sections = getSections();
    const sectionScores = sections.map(section => {
      const sectionQuestions = questions.filter(q => q.sectionId === section.id);
      const sectionResponses = responses.filter(r => 
        sectionQuestions.some(sq => sq.id === r.questionId)
      );
      const correct = sectionResponses.filter(r => r.isCorrect).length;
      return {
        sectionName: section.name,
        total: sectionQuestions.length,
        correct,
      };
    });

    navigate('/result', { 
      state: { 
        attempt,
        sectionScores,
        candidateName: state.candidateName,
      } 
    });
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

  if (!currentQuestion) {
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <span className="font-display font-semibold text-primary">ThinkerzHub</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {state?.candidateName}
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <ProgressBar current={currentIndex + 1} total={questions.length} />
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
                timeLimit={currentQuestion.timeLimit}
                onTimeUp={handleTimeUp}
                isPaused={isTransitioning}
              />
            </motion.div>
          </div>

          {/* Question Card */}
          <AnimatePresence mode="wait">
            <QuestionCard
              key={currentQuestion.id}
              question={currentQuestion}
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
