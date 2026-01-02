import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Trophy, CheckCircle, XCircle, Target, Home, Award, Star } from 'lucide-react';
import { DetailedResults } from '@/components/DetailedResults';
import logo from '@/assets/logo.webp';

interface SectionScore {
  sectionName: string;
  total: number;
  correct: number;
}

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

interface LocationState {
  attempt: {
    id: string;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    total_score: number;
  };
  sectionScores: SectionScore[];
  candidateName: string;
  detailedQuestions: QuestionDetail[];
}

export default function Result() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  if (!state?.attempt) {
    navigate('/');
    return null;
  }

  const { attempt, sectionScores, candidateName, detailedQuestions } = state;
  const percentage = Math.round((attempt.correctAnswers / attempt.totalQuestions) * 100);

  const getBadge = () => {
    if (percentage >= 90) return { label: 'Outstanding!', icon: Star, color: 'text-warning' };
    if (percentage >= 75) return { label: 'Excellent Performance', icon: Award, color: 'text-primary' };
    if (percentage >= 60) return { label: 'Good Attempt', icon: Trophy, color: 'text-success' };
    if (percentage >= 40) return { label: 'Keep Practicing', icon: Target, color: 'text-accent' };
    return { label: 'Room for Improvement', icon: Target, color: 'text-muted-foreground' };
  };

  const badge = getBadge();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-center">
          <img src={logo} alt="ThinkerZ Hub" className="h-12 object-contain" />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Success Animation */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            <div className="relative inline-block">
              <motion.div
                className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <CheckCircle className="w-12 h-12 text-success" />
              </motion.div>
              <motion.div
                className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-warning flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
              >
                <badge.icon className="w-5 h-5 text-warning-foreground" />
              </motion.div>
            </div>
          </motion.div>

          {/* Greeting */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
              Test Completed!
            </h1>
            <p className="text-muted-foreground">
              Great job, {candidateName}! Here's your performance summary.
            </p>
          </motion.div>

          {/* Badge */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary font-display font-semibold ${badge.color}`}>
              <badge.icon className="w-5 h-5" />
              {badge.label}
            </span>
          </motion.div>

          {/* Score Card */}
          <motion.div
            className="bg-card rounded-2xl p-6 shadow-soft border border-border mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {/* Score Circle */}
            <div className="flex justify-center mb-6">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-muted"
                  />
                  <motion.circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    className="text-primary"
                    initial={{ strokeDasharray: "440", strokeDashoffset: "440" }}
                    animate={{ strokeDashoffset: 440 - (440 * percentage) / 100 }}
                    transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span
                    className="text-4xl font-display font-bold text-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    {percentage}%
                  </motion.span>
                  <span className="text-sm text-muted-foreground">Score</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <motion.div
                className="text-center p-4 bg-muted/50 rounded-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <div className="flex items-center justify-center gap-1 text-foreground mb-1">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">{attempt.totalQuestions}</span>
                </div>
                <span className="text-xs text-muted-foreground">Total</span>
              </motion.div>
              <motion.div
                className="text-center p-4 bg-success/10 rounded-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <div className="flex items-center justify-center gap-1 text-success mb-1">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-2xl font-bold">{attempt.correctAnswers}</span>
                </div>
                <span className="text-xs text-muted-foreground">Correct</span>
              </motion.div>
              <motion.div
                className="text-center p-4 bg-destructive/10 rounded-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <div className="flex items-center justify-center gap-1 text-destructive mb-1">
                  <XCircle className="w-4 h-4" />
                  <span className="text-2xl font-bold">{attempt.incorrectAnswers}</span>
                </div>
                <span className="text-xs text-muted-foreground">Incorrect</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Section-wise Performance */}
          <motion.div
            className="bg-card rounded-2xl p-6 shadow-soft border border-border mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <h3 className="font-display font-semibold text-foreground mb-4">
              Section-wise Performance
            </h3>
            <div className="space-y-4">
              {sectionScores.map((section, index) => {
                const sectionPercentage = section.total > 0 
                  ? Math.round((section.correct / section.total) * 100) 
                  : 0;
                return (
                  <motion.div
                    key={section.sectionName}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.1 + index * 0.1 }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-foreground">{section.sectionName}</span>
                      <span className="text-sm text-muted-foreground">
                        {section.correct} / {section.total}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${sectionPercentage}%` }}
                        transition={{ duration: 0.5, delay: 1.2 + index * 0.1 }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Detailed Question Review */}
          {detailedQuestions && detailedQuestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
              className="mb-8"
            >
              <DetailedResults questions={detailedQuestions} />
            </motion.div>
          )}

          {/* Action Button */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            <Button
              variant="default"
              size="lg"
              onClick={() => navigate('/')}
            >
              <Home className="w-4 h-4" />
              Return to Home
            </Button>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
