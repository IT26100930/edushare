import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { AuthLayout } from '../components/auth/AuthLayout.tsx';

export const CompletePasswordRecoveryPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setMessage('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8 || password.length > 128 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must be 8–128 characters with a letter and number.'); return;
    }
    setBusy(true);
    try {
      const response = await fetch('/api/password-recovery/complete', {
        method: 'POST', credentials: 'include', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email: email.trim(), code: code.trim(), newPassword: password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || `Reset failed (HTTP ${response.status}).`);
      setMessage(result.message || 'Password updated successfully.');
      setCode(''); setPassword(''); setConfirm('');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not connect to EduShare.'); }
    finally { setBusy(false); }
  };
  const inputClass = 'w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white';
  return <AuthLayout>
    <div className="space-y-5 text-gray-900 dark:text-white">
      <div className="flex items-center gap-3"><ShieldCheck className="text-[#FF4A00]" size={30}/>
        <h1 className="text-2xl sm:text-3xl font-extrabold">Choose a new password</h1></div>
      <p className="text-sm text-gray-600 dark:text-gray-300">Once an administrator approves your recovery request and privately gives you a one-time code, enter it here. Codes expire after 30 minutes and work only once. No email is sent.</p>
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-sm font-semibold">Registered email address<input type="email" required autoComplete="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} className={inputClass}/></label>
        <label className="block text-sm font-semibold">One-time recovery code<input type="text" required autoComplete="off" value={code} onChange={e=>setCode(e.target.value)} className={inputClass}/></label>
        <label className="block text-sm font-semibold">New password<input type="password" required autoComplete="new-password" minLength={8} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)} className={inputClass}/></label>
        <label className="block text-sm font-semibold">Confirm password<input type="password" required autoComplete="new-password" minLength={8} maxLength={128} value={confirm} onChange={e=>setConfirm(e.target.value)} className={inputClass}/></label>
        <button disabled={busy || Boolean(message)} type="submit" className="w-full rounded-full bg-[#FF4A00] px-5 py-3 font-bold text-white disabled:opacity-50">{busy?'Updating...':'Set My New Password'}</button>
      </form>
      {error && <div role="alert" className="rounded-xl bg-red-50 text-red-700 p-3 text-sm">{error}</div>}
      {message && <div role="status" className="rounded-xl bg-green-50 text-green-800 p-3 text-sm">{message} <Link to="/login" className="font-bold underline">Go to Login</Link></div>}
      <Link to="/forgot-password" className="text-sm font-bold text-[#FF4A00]">Request admin recovery</Link>
    </div>
  </AuthLayout>;
};
