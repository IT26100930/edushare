import React, { useState } from 'react';
import { Link, useNavigate,useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { AuthLayout } from '../components/auth/AuthLayout.tsx';
import { Tag } from '../components/Tag.tsx';
import { Button } from '../components/Button.tsx';
import { validateLoginEmail } from '../utils/authValidation.ts';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location=useLocation();
  const { acceptAuthenticatedUser, addToast } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const isEmailValid = validateLoginEmail(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!isEmailValid) {
      setFormError('Please enter a valid university or personal email address.');
      return;
    }

    if (!password) {
      setFormError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (!response.ok) throw new Error(response.status === 403 ? 'This account uses the separate administrator portal.' : 'Invalid email or password');
      const backendUser = await response.json();
      acceptAuthenticatedUser(backendUser);
      addToast({ title: `Welcome back, ${backendUser.name}!`, message: 'Signed in successfully.', type: 'success' });
      const requested=location.state?.from;
      navigate(typeof requested==='string'&&requested.startsWith('/')&&!requested.startsWith('//')?requested:'/browse',{replace:true});
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <Tag variant="peach">Welcome Back</Tag>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-neutral-900 dark:text-neutral-100">
            Sign In to EduShare
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            Access your university notes, past papers, and campus study lounges.
          </p>
        </div>

<form onSubmit={handleSubmit} className="space-y-4">
          {/* Email field with live indicator */}
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="login-email"
              className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300"
            >
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-4 pointer-events-none dark:text-neutral-300" />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="name@example.com"
                className={`w-full py-3.5 pl-11 pr-11 rounded-full text-sm font-medium bg-neutral-50/80 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FF4A00] ${
                  email && !isEmailValid
                    ? 'border-rose-400'
                    : 'border-neutral-300 dark:border-neutral-700'
                }`}
                required
              />
              <div className="absolute right-4 pointer-events-none">
                {email && isEmailValid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : email && !isEmailValid ? (
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                ) : null}
              </div>
            </div>
            {email && !isEmailValid && (
              <p
                role="alert"
                aria-live="polite"
                className="text-xs text-rose-500 font-medium pl-2"
              >
                {"Please enter a valid email address."}
              </p>
            )}
          </div>

          {/* Password field with show/hide toggle */}
          <div className="space-y-1.5 text-left">
            <div className="flex items-center justify-between">
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300"
              >
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-[#FF4A00] hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-4 pointer-events-none dark:text-neutral-300" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
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
          </div>

          {formError && (
            <p
              role="alert"
              aria-live="assertive"
              className="text-xs text-rose-500 font-semibold pl-2"
            >
              {formError}
            </p>
          )}

          {/* Orange Pill Log in Button */}
          <Button
            variant="primary"
            size="lg"
            type="submit"
            disabled={isSubmitting}
            className="w-full justify-center shadow-md mt-1 cursor-pointer"
          >
            <span>{isSubmitting ? 'Signing in...' : 'Log in'}</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>

        </form>

        {/* Link to Register */}
        <div className="text-center text-xs text-neutral-500 pt-2 dark:text-neutral-300">
          Don&apos;t have an EduShare account?{' '}
          <Link to="/register" className="text-[#FF4A00] font-bold hover:underline">
            Register here &rarr;
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};
