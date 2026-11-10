import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  AtSign,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Check,
  X,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { AuthLayout } from '../components/auth/AuthLayout.tsx';
import { Tag } from '../components/Tag.tsx';
import { Button } from '../components/Button.tsx';
import {
  validateEmail,
  evaluatePassword,
  RESERVED_USERNAMES,
} from '../utils/authValidation.ts';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { users, addToast } = useApp();

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeAcademicPledge, setAgreeAcademicPledge] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Live Username Check
  const usernameCheck = useMemo(() => {
    const clean = username.trim().toLowerCase().replace(/^@/, '');
    if (!clean) {
      return { status: 'empty', message: '' };
    }
    if (clean.length < 3) {
      return { status: 'invalid', message: 'Username must be at least 3 characters.' };
    }
    if (!/^[a-z0-9_]+$/.test(clean)) {
      return { status: 'invalid', message: 'Only lowercase letters, numbers, and underscores.' };
    }
    if (RESERVED_USERNAMES.includes(clean)) {
      return { status: 'reserved', message: `"${clean}" is a reserved system handle.` };
    }
    // Check whether this account already exists on the backend
    const exists = users.some(
      (u) =>
        u.name.toLowerCase().replace(/[^a-z0-9]/g, '') === clean ||
        u.email.toLowerCase().split('@')[0] === clean
    );
    if (exists) {
      return { status: 'taken', message: `@${clean} is already claimed by another student.` };
    }
    return { status: 'available', message: `@${clean} is available!` };
  }, [username, users]);

  // 2. Live Email Check
  const emailCheck = useMemo(() => {
    return validateEmail(email);
  }, [email]);

  // 3. Password Strength & Rules
  const passwordEval = useMemo(() => {
    return evaluatePassword(password);
  }, [password]);

  // 4. Confirm Password Match
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  // 5. Total Form Validity for Submit Button
  const isFormValid =
    name.trim().length >= 2 &&
    usernameCheck.status === 'available' &&
    emailCheck.isValid &&
    passwordEval.score >= 3 &&
    passwordsMatch &&
    agreeTerms &&
    agreeAcademicPledge;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), username: username.trim().toLowerCase(), email: email.trim(), password, premium: false }),
      });
      if (!response.ok) { const detail = await response.json().catch(() => ({})); throw new Error(detail.error || 'Registration failed'); }
      addToast({ title: 'Check your email to verify', message: 'We sent a verification link to your registered inbox. Verify before signing in.', type: 'success' });
      navigate('/login');
    } catch (error) {
      addToast({ title: 'Registration failed', message: error instanceof Error ? error.message : 'Please try again.', type: 'error' });
    } finally { setIsSubmitting(false); }
  };

  const handleFixTypo = (suggested: string) => {
    setEmail(suggested);
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-1.5">
          <Tag variant="peach">Get Started</Tag>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-neutral-900 dark:text-neutral-100">
            Create Your Account
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            Create an EduShare account to share and find learning resources.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1 text-left">
            <label
              htmlFor="reg-name"
              className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300"
            >
              Full Name
            </label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-neutral-400 absolute left-4 pointer-events-none dark:text-neutral-300" />
              <input
                id="reg-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Kasun Jayasuriya"
                className="w-full py-3.5 pl-11 pr-4 rounded-full text-sm font-medium bg-neutral-50/80 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#FF4A00]"
                required
              />
            </div>
          </div>

          {/* Username with Live Check */}
          <div className="space-y-1 text-left">
            <div className="flex items-center justify-between">
              <label
                htmlFor="reg-username"
                className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300"
              >
                Choose @Username
              </label>
              {usernameCheck.status === 'available' && (
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Available</span>
                </span>
              )}
            </div>
            <div className="relative flex items-center">
              <AtSign className="w-4 h-4 text-neutral-400 absolute left-4 pointer-events-none dark:text-neutral-300" />
              <input
                id="reg-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                placeholder="kasunj_cs"
                className={`w-full py-3.5 pl-11 pr-11 rounded-full text-sm font-medium bg-neutral-50/80 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FF4A00] ${
                  usernameCheck.status === 'available'
                    ? 'border-emerald-500'
                    : usernameCheck.status === 'taken' || usernameCheck.status === 'reserved'
                    ? 'border-rose-400'
                    : 'border-neutral-300 dark:border-neutral-700'
                }`}
                required
              />
              <div className="absolute right-4 pointer-events-none">
                {usernameCheck.status === 'available' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : usernameCheck.status === 'taken' || usernameCheck.status === 'reserved' ? (
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                ) : null}
              </div>
            </div>
            {usernameCheck.message && usernameCheck.status !== 'available' && (
              <p
                role="alert"
                aria-live="polite"
                className="text-xs text-rose-500 font-medium pl-2"
              >
                {usernameCheck.message}
              </p>
            )}
          </div>

          {/* Email with Live Validation + University Badge + Typo Fix */}
          <div className="space-y-1 text-left">
            <div className="flex items-center justify-between">
              <label
                htmlFor="reg-email"
                className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300"
              >
                Email Address
              </label>
              {emailCheck.isUniversity && (
                <span className="text-[11px] font-bold text-[#1E6FEB] bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full flex items-center gap-1 border border-blue-200 dark:border-blue-800">
                  <GraduationCap className="w-3 h-3 text-[#1E6FEB]" />
                  <span>Student email detected</span>
                </span>
              )}
            </div>

            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-4 pointer-events-none dark:text-neutral-300" />
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className={`w-full py-3.5 pl-11 pr-11 rounded-full text-sm font-medium bg-neutral-50/80 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FF4A00] ${
                  email && !emailCheck.isValid
                    ? 'border-rose-400'
                    : emailCheck.isValid
                    ? 'border-emerald-500'
                    : 'border-neutral-300 dark:border-neutral-700'
                }`}
                required
              />
              <div className="absolute right-4 pointer-events-none">
                {emailCheck.isValid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : email && !emailCheck.isValid ? (
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                ) : null}
              </div>
            </div>

            {/* Email feedback messages & typo fix */}
            {email && !emailCheck.isValid && (
              <div
                role="alert"
                aria-live="polite"
                className="text-xs text-rose-500 font-medium pl-2 flex items-center justify-between"
              >
                <span>{emailCheck.message}</span>
                {emailCheck.typoSuggestion && (
                  <button
                    type="button"
                    onClick={() => handleFixTypo(emailCheck.typoSuggestion!)}
                    className="text-xs font-bold text-[#FF4A00] underline hover:opacity-80 ml-2"
                  >
                    Click to fix: {emailCheck.typoSuggestion.split('@')[1]}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Password with 4-Segment Strength Meter & Rules Checklist */}
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="reg-password"
              className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300"
            >
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-4 pointer-events-none dark:text-neutral-300" />
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create strong password"
                className="w-full py-3.5 pl-11 pr-11 rounded-full text-sm font-medium bg-neutral-50/80 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#FF4A00]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-4 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors p-1 dark:text-neutral-300"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* 4-Segment Strength Meter */}
            {password.length > 0 && (
              <div className="pt-1 space-y-1">
                <div className="flex items-center gap-1.5 h-1.5 w-full">
                  {[1, 2, 3, 4].map((seg) => {
                    const isFilled = passwordEval.score >= seg;
                    const color =
                      passwordEval.score === 1
                        ? 'bg-rose-500'
                        : passwordEval.score === 2
                        ? 'bg-[#FF4A00]'
                        : passwordEval.score === 3
                        ? 'bg-[#FFB31F]'
                        : 'bg-emerald-500';

                    return (
                      <div
                        key={seg}
                        className={`h-full flex-1 rounded-full transition-all duration-300 ${
                          isFilled ? color : 'bg-neutral-200 dark:bg-neutral-700'
                        }`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between text-[11px] font-semibold text-neutral-500 dark:text-neutral-300">
                  <span>Strength: {passwordEval.strengthLabel}</span>
                  <span className="tabular-nums font-mono">{passwordEval.score}/4</span>
                </div>
              </div>
            )}

            {/* Rules Checklist */}
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-700/60 grid grid-cols-2 gap-1.5 text-[11px]">
              <div className="flex items-center gap-1.5">
                {passwordEval.rules.length ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                ) : (
                  <X className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-300" />
                )}
                <span className={passwordEval.rules.length ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-neutral-500'}>
                  8+ characters
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {passwordEval.rules.upper && passwordEval.rules.lower ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                ) : (
                  <X className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-300" />
                )}
                <span className={passwordEval.rules.upper && passwordEval.rules.lower ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-neutral-500'}>
                  Upper & lowercase
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {passwordEval.rules.number ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                ) : (
                  <X className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-300" />
                )}
                <span className={passwordEval.rules.number ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-neutral-500'}>
                  At least 1 number
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {passwordEval.rules.notCommon ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                ) : (
                  <X className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-300" />
                )}
                <span className={passwordEval.rules.notCommon ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-neutral-500'}>
                  Not common password
                </span>
              </div>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1 text-left">
            <label
              htmlFor="reg-confirm"
              className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300"
            >
              Confirm Password
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-4 pointer-events-none dark:text-neutral-300" />
              <input
                id="reg-confirm"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className={`w-full py-3.5 pl-11 pr-11 rounded-full text-sm font-medium bg-neutral-50/80 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FF4A00] ${
                  confirmPassword && !passwordsMatch
                    ? 'border-rose-400'
                    : confirmPassword && passwordsMatch
                    ? 'border-emerald-500'
                    : 'border-neutral-300 dark:border-neutral-700'
                }`}
                required
              />
              <div className="absolute right-4 pointer-events-none">
                {confirmPassword && passwordsMatch ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : confirmPassword && !passwordsMatch ? (
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                ) : null}
              </div>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p
                role="alert"
                aria-live="polite"
                className="text-xs text-rose-500 font-medium pl-2"
              >
                Passwords do not match.
              </p>
            )}
          </div>

          {/* Two Required Checkboxes */}
          <div className="space-y-2 pt-2 text-xs text-neutral-600 dark:text-neutral-400 text-left">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded accent-[#FF4A00]"
                required
              />
              <span>
                I agree to the{' '}
                <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-[#FF4A00] underline font-semibold">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="text-[#FF4A00] underline font-semibold">
                  Privacy Policy
                </Link>.
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeAcademicPledge}
                onChange={(e) => setAgreeAcademicPledge(e.target.checked)}
                className="mt-0.5 rounded accent-[#FF4A00]"
                required
              />
              <span>
                I pledge that I will only share content I have the rights to distribute. Read our{' '}
                <Link to="/academic-integrity" target="_blank" rel="noopener noreferrer" className="text-[#FF4A00] underline font-semibold">Academic Integrity Policy</Link>.
              </span>
            </label>
          </div>

          {/* Submit Button (Disabled until all conditions pass) */}
          <Button
            variant="primary"
            size="lg"
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className={`w-full justify-center shadow-md mt-2 transition-all ${
              !isFormValid ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <span>{isSubmitting ? 'Verifying profile...' : 'Continue to Verification'}</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </form>

        {/* Link to Login */}
        <div className="text-center text-xs text-neutral-500 pt-2 dark:text-neutral-300">
          Already registered?{' '}
          <Link to="/login" className="text-[#FF4A00] font-bold hover:underline">
            Sign in here &rarr;
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};
