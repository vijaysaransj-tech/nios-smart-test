import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface QuestionDetail {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  section_name: string;
  selected_answer: string | null;
  is_correct: boolean;
  time_taken: number;
}

interface SectionGroup {
  sectionName: string;
  questions: QuestionDetail[];
  correct: number;
  total: number;
}

interface DetailedResultsProps {
  questions: QuestionDetail[];
}

export function DetailedResults({ questions }: DetailedResultsProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Group questions by section
  const sectionGroups: SectionGroup[] = [];
  const sectionMap = new Map<string, QuestionDetail[]>();

  questions.forEach(q => {
    const existing = sectionMap.get(q.section_name) || [];
    existing.push(q);
    sectionMap.set(q.section_name, existing);
  });

  sectionMap.forEach((questions, sectionName) => {
    sectionGroups.push({
      sectionName,
      questions,
      correct: questions.filter(q => q.is_correct).length,
      total: questions.length,
    });
  });

  const toggleSection = (sectionName: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionName)) {
      newExpanded.delete(sectionName);
    } else {
      newExpanded.add(sectionName);
    }
    setExpandedSections(newExpanded);
  };

  const getOptionLabel = (option: 'A' | 'B' | 'C' | 'D', question: QuestionDetail) => {
    switch (option) {
      case 'A': return question.option_a;
      case 'B': return question.option_b;
      case 'C': return question.option_c;
      case 'D': return question.option_d;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-display font-semibold text-foreground text-lg mb-4">
        Detailed Question Review
      </h3>
      
      {sectionGroups.map((section, sectionIndex) => {
        const isExpanded = expandedSections.has(section.sectionName);
        const sectionPercentage = Math.round((section.correct / section.total) * 100);

        return (
          <motion.div
            key={section.sectionName}
            className="bg-card rounded-xl border border-border overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
          >
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.sectionName)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold",
                  sectionPercentage >= 70 ? "bg-success/10 text-success" :
                  sectionPercentage >= 40 ? "bg-warning/10 text-warning" :
                  "bg-destructive/10 text-destructive"
                )}>
                  {sectionPercentage}%
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-foreground">{section.sectionName}</h4>
                  <p className="text-sm text-muted-foreground">
                    {section.correct} / {section.total} correct
                  </p>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            {/* Questions List */}
            {isExpanded && (
              <div className="border-t border-border divide-y divide-border">
                {section.questions.map((question, qIndex) => (
                  <div key={question.id} className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                        question.is_correct ? "bg-success/10" : "bg-destructive/10"
                      )}>
                        {question.is_correct ? (
                          <CheckCircle className="w-4 h-4 text-success" />
                        ) : (
                          <XCircle className="w-4 h-4 text-destructive" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-1">Question {qIndex + 1}</p>
                        <p className="font-medium text-foreground">{question.question_text}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {question.time_taken}s
                      </div>
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-9">
                      {(['A', 'B', 'C', 'D'] as const).map(opt => {
                        const isCorrect = question.correct_answer === opt;
                        const isSelected = question.selected_answer === opt;
                        const optionText = getOptionLabel(opt, question);

                        return (
                          <div
                            key={opt}
                            className={cn(
                              "px-3 py-2 rounded-lg text-sm border transition-colors",
                              isCorrect && "bg-success/10 border-success/30 text-success",
                              isSelected && !isCorrect && "bg-destructive/10 border-destructive/30 text-destructive",
                              !isCorrect && !isSelected && "bg-muted/50 border-border text-muted-foreground"
                            )}
                          >
                            <span className="font-medium">{opt}.</span> {optionText}
                            {isCorrect && <span className="ml-2 text-xs">(Correct)</span>}
                            {isSelected && !isCorrect && <span className="ml-2 text-xs">(Your answer)</span>}
                          </div>
                        );
                      })}
                    </div>

                    {!question.selected_answer && (
                      <p className="text-xs text-muted-foreground ml-9 mt-2">
                        No answer selected (time ran out)
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
