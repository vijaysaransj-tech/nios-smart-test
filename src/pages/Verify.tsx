import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, ArrowLeft, User, Mail, Phone, AlertCircle, CheckCircle } from 'lucide-react';
import { findCandidate, updateCandidateStatus, createTestAttempt, getTestSettings } from '@/lib/store';

const verifySchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string().trim().email('Please enter a valid email address').max(255),
  phone: z.string().trim().regex(/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'),
});

type VerifyFormData = z.infer<typeof verifySchema>;

export default function Verify() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<VerifyFormData>({
    fullName: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof VerifyFormData, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleInputChange = (field: keyof VerifyFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setSubmitError(null);

    // Validate form
    const result = verifySchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof VerifyFormData, string>> = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as keyof VerifyFormData;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      setIsVerifying(false);
      return;
    }

    // Check if test is enabled
    const settings = getTestSettings();
    if (!settings.isTestEnabled) {
      setSubmitError('The admission test is currently not available. Please try again later.');
      setIsVerifying(false);
      return;
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Find candidate
    const candidate = findCandidate(formData.fullName, formData.email, formData.phone);

    if (!candidate) {
      setSubmitError('You are not authorized to take the NIOS Admission Test. Please contact the administration.');
      setIsVerifying(false);
      return;
    }

    if (candidate.testStatus === 'ATTEMPTED') {
      setSubmitError('You have already completed this test. Each candidate can only attempt the test once.');
      setIsVerifying(false);
      return;
    }

    // Create test attempt and start test
    const attempt = createTestAttempt(candidate.id);
    updateCandidateStatus(candidate.id, 'ATTEMPTED');

    // Navigate to test with attempt info
    navigate('/test', { state: { attemptId: attempt.id, candidateId: candidate.id, candidateName: candidate.fullName } });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <span className="font-display font-semibold text-primary">ThinkerzHub</span>
          </div>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <User className="w-8 h-8 text-primary" />
            </motion.div>
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">
              Verify Your Identity
            </h1>
            <p className="text-muted-foreground">
              Enter your registered details to start the admission test
            </p>
          </div>

          <motion.form
            onSubmit={handleSubmit}
            className="bg-card rounded-2xl p-6 shadow-soft border border-border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="space-y-5">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className={errors.fullName ? 'border-destructive' : ''}
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.fullName}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter 10-digit phone number"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  maxLength={10}
                  className={errors.phone ? 'border-destructive' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Submit Error */}
            {submitError && (
              <motion.div
                className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-sm text-destructive flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {submitError}
                </p>
              </motion.div>
            )}

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full mt-6"
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <motion.div
                    className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Verify & Start Test
                </>
              )}
            </Button>
          </motion.form>

          <motion.p
            className="text-center text-sm text-muted-foreground mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Your details must match exactly with your registration
          </motion.p>
        </motion.div>
      </main>
    </div>
  );
}
