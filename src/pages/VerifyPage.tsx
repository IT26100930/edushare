import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { AuthLayout } from '../components/auth/AuthLayout.tsx';
import { Tag } from '../components/Tag.tsx';

/** A real admin review request. It does not falsely claim to send a security code. */
export const VerifyPage: React.FC = () => {
  const { currentUser, addToast } = useApp();
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<string>('loading');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const refresh = async () => {
    const response = await fetch('/api/verification/me', { credentials: 'include', cache: 'no-store' });
    if (!response.ok) throw new Error('Unable to load verification status.');
    const result: {status: string; verified: boolean} = await response.json();
    setStatus(result.verified ? 'approved' : result.status);
  };
  useEffect(() => { if (currentUser) void refresh().catch(() => setStatus('unavailable')); }, [currentUser?.id]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true); setError('');
    try {
      const response = await fetch('/api/verification/requests', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({note: note.trim()}),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Request could not be saved.');
      }
      await refresh();
      addToast({title: 'Review request submitted', message: 'An administrator can review your account details.', type: 'success'});
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Please try again.'); }
    finally { setSubmitting(false); }
  };

  return (
    <AuthLayout>
      <div className="space-y-6 max-w-lg mx-auto">
        <Tag variant="peach">Account Review</Tag>
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">Request account verification</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            EduShare administrators can review the account information you provide.
            This is a manual review. No email code or official student ID verification is performed automatically.
          </p>
        </div>
        {!currentUser ? (
          <Link to="/login" className="text-[#FF4A00] font-semibold">Sign in to request verification</Link>
        ) : status === 'approved' ? (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-5 h-5" /> This account has been approved by an EduShare administrator.
          </div>
        ) : status === 'pending' ? (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
            <Clock className="w-5 h-5" /> Your request is pending administrator review.
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm text-neutral-700 dark:text-neutral-200">Signed in as {currentUser.name}</p>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-200">Message to administrator (optional)</label>
            <textarea value={note} onChange={event => setNote(event.target.value)} maxLength={1000}
              placeholder="For example: My university and course are updated on my profile."
              className="w-full h-28 p-4 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white" />
            {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
            <button disabled={submitting} type="submit" className="w-full py-3 rounded-full bg-[#FF4A00] text-white font-bold disabled:opacity-50">
              <ShieldCheck className="w-4 h-4 inline mr-2" />{submitting ? 'Submitting…' : 'Send review request'}
            </button>
          </form>
        )}
        <Link className="text-[#FF4A00] font-semibold text-sm" to="/profile">Back to profile</Link>
      </div>
    </AuthLayout>
  );
};
