import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { QuestionWithSection } from '@/lib/types';

interface QuestionCardProps {
  question: QuestionWithSection;
  selectedAnswer?: 'A' | 'B' | 'C' | 'D';
  onSelectAnswer: (answer: 'A' | 'B' | 'C' | 'D') => void;
}

const optionLabels = {
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
} as const;

export function QuestionCard({ question, selectedAnswer, onSelectAnswer }: QuestionCardProps) {
  const options = [
    { key: 'A' as const, text: question.optionA },
    { key: 'B' as const, text: question.optionB },
    { key: 'C' as const, text: question.optionC },
    { key: 'D' as const, text: question.optionD },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full"
    >
      {/* Section badge */}
      <motion.div 
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full text-secondary-foreground text-sm font-medium mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <span className="w-2 h-2 rounded-full bg-primary" />
        {question.sectionName}
      </motion.div>

      {/* Question number */}
      <motion.p 
        className="text-muted-foreground text-sm mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        Question {question.questionNumber} of {question.totalQuestions}
      </motion.p>

      {/* Question text */}
      <motion.h2 
        className="text-xl md:text-2xl font-display font-semibold text-foreground mb-8 leading-relaxed"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {question.questionText}
      </motion.h2>

      {/* Options */}
      <div className="grid gap-3">
        {options.map((option, index) => (
          <motion.div
            key={option.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 + index * 0.05 }}
          >
            <Button
              variant={selectedAnswer === option.key ? 'optionSelected' : 'option'}
              className="w-full group"
              onClick={() => onSelectAnswer(option.key)}
            >
              <span className={`flex items-center justify-center w-8 h-8 rounded-lg text-sm font-semibold mr-3 transition-colors ${
                selectedAnswer === option.key 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary'
              }`}>
                {optionLabels[option.key]}
              </span>
              <span className="flex-1">{option.text}</span>
            </Button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
