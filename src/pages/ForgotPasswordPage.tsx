import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ShieldCheck } from 'lucide-react';
import { AuthLayout } from '../components/auth/AuthLayout.tsx';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const requestRecovery = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/email-auth/forgot', {
        method: 'POST', credentials: 'include',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({email:email.trim()}),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not submit recovery request.');
      setMessage(data.message || 'If this account exists, an administrator will review your request.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not connect to the server.');
    } finally { setBusy(false); }
  };

  return (
    <AuthLayout>
      <div className="space-y-6 text-gray-900 dark:text-white">
        <div className="flex items-center gap-3"><ShieldCheck className="text-[#FF4A00]" size={32}/>
          <h1 className="text-3xl font-extrabold">Recover your EduShare account</h1>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Enter your registered, verified email. We will email you a secure password-reset link (valid for 30 minutes).
        </p>
        <form onSubmit={requestRecovery} className="space-y-4">
          <label htmlFor="recovery-email" className="block text-xs font-bold uppercase">Registered email address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
            <input id="recovery-email" type="email" required maxLength={254} value={email}
              onChange={e=>setEmail(e.target.value)} placeholder="name@example.com"
              className="w-full py-3 pl-12 pr-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
          </div>
          <button type="submit" disabled={busy} className="w-full rounded-full bg-[#FF4A00] px-5 py-3 font-bold text-white disabled:opacity-50">
            {busy ? 'Submitting...' : 'Email Reset Link'}
          </button>
        </form>
        {message && <div role="status" className="rounded-xl border border-green-300 bg-green-50 dark:bg-green-950/30 p-4 text-sm text-green-900 dark:text-green-200">{message}</div>}
        {error && <div role="alert" className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-800 dark:text-red-200">{error}</div>}
        <p className="text-xs text-gray-500 dark:text-gray-400">This works with real inboxes only. Check Spam if you do not see the email. For privacy, we do not disclose whether an email is registered.</p>
        <div className="flex flex-wrap gap-4 text-sm font-bold text-[#FF4A00]">

          <Link to="/login" className="hover:underline">Back to Login</Link>
        </div>
      </div>
    </AuthLayout>
  );
};
