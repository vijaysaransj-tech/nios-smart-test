import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, CheckCircle, Shield, GraduationCap, ArrowRight } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    { icon: Clock, title: 'Timed Questions', description: 'Each question has a specific time limit' },
    { icon: CheckCircle, title: 'Instant Submission', description: 'Your answers are saved automatically' },
    { icon: Shield, title: 'One-Time Attempt', description: 'Test can only be taken once' },
  ];

  const instructions = [
    'The test consists of multiple-choice questions from different sections',
    'Each question has a specific time limit - answer before time runs out',
    'Once you select an answer, you will automatically move to the next question',
    'You cannot go back to previous questions',
    'Your final score will be displayed after completing all questions',
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/20" />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Logo/Brand */}
            <motion.div
              className="inline-flex items-center gap-3 mb-6 px-4 py-2 bg-secondary rounded-full"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <GraduationCap className="w-5 h-5 text-primary" />
              <span className="font-display font-semibold text-primary">ThinkerzHub</span>
            </motion.div>

            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              NIOS Admission Test
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Take the standardized admission assessment for the National Institute of Open Schooling. 
              Designed for 10th standard students.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                variant="hero"
                size="xl"
                onClick={() => navigate('/verify')}
                className="group"
              >
                Start Admission Test
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            className="grid md:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="bg-card rounded-2xl p-6 shadow-soft hover:shadow-elevated transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Instructions Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-accent" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground">
                Test Instructions
              </h2>
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-soft border border-border">
              <ul className="space-y-4">
                {instructions.map((instruction, index) => (
                  <motion.li
                    key={index}
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-foreground">{instruction}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            <motion.div
              className="mt-8 p-4 bg-warning/10 border border-warning/20 rounded-xl"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              viewport={{ once: true }}
            >
              <p className="text-sm text-foreground">
                <strong className="text-warning">Important:</strong> Make sure you have a stable internet connection before starting the test. 
                You can only attempt this test once, so please prepare accordingly.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 ThinkerzHub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
