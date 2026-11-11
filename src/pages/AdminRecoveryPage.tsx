import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const AdminRecoveryPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword.length < 8) {setError('Choose a password with at least 8 characters.'); return;}
    if (newPassword !== confirm) {setError('New passwords do not match.'); return;}
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/auth/admin-recovery', {
        method:'POST', credentials:'include', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({email:email.trim(), recoveryToken, newPassword}),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Could not reset password (HTTP ${response.status}).`);
      setDone(true); setNewPassword(''); setConfirm(''); setRecoveryToken('');
    } catch(e) {setError(e instanceof Error ? e.message : 'Could not reset password.');}
    finally {setBusy(false);}
  };
  return <main className="min-h-screen bg-[#f5f7fc] dark:bg-[#121827] flex items-center justify-center p-5 text-slate-900 dark:text-white">
    <div className="w-full max-w-md">
      <div className="text-center mb-7"><div className="h-14 w-14 bg-[#263577] text-white rounded-2xl grid place-items-center mx-auto mb-4"><ShieldCheck/></div>
        <p className="text-xs uppercase tracking-[.2em] font-bold text-[#263577] dark:text-blue-300">EduShare Management</p>
        <h1 className="text-3xl font-extrabold mt-2">Recover Admin Access</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Reset your administrator password. Existing accounts and resources will remain available.</p>
      </div>
      <section className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-7">
      {done ? <div className="text-center space-y-4" role="status"><CheckCircle2 size={46} className="text-emerald-600 mx-auto"/><h2 className="font-bold text-xl">Password updated</h2><p className="text-sm text-slate-500">Sign in with your new password.</p><Link to="/admin/login" className="inline-block px-5 py-3 rounded-xl bg-[#263577] text-white font-bold">Go to Admin Login</Link></div> :
        <form onSubmit={submit} className="space-y-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900 p-3 text-sm text-slate-700 dark:text-slate-200"><KeyRound className="inline-block mr-2" size={16}/>Enter your private administrator recovery token. This is different from your password. If you do not have it, contact the person managing EduShare. Never share this token.</div>
          <label className="block text-sm font-semibold">Admin Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-xl border p-3 dark:bg-slate-800 dark:border-slate-600" placeholder="Your admin email"/></label>
          <label className="block text-sm font-semibold">Administrator Recovery Token<input type="password" required value={recoveryToken} onChange={e=>setRecoveryToken(e.target.value)} className="mt-2 w-full rounded-xl border p-3 dark:bg-slate-800 dark:border-slate-600" placeholder="Your private recovery token"/></label>
          <label className="block text-sm font-semibold">New Password<div className="relative"><input type={visible?'text':'password'} required minLength={8} value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="mt-2 w-full rounded-xl border p-3 pr-12 dark:bg-slate-800 dark:border-slate-600" placeholder="At least 8 characters"/><button type="button" onClick={()=>setVisible(!visible)} aria-label="Toggle password visibility" className="absolute right-3 top-5 text-slate-500">{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
          <label className="block text-sm font-semibold">Confirm Password<input type="password" required minLength={8} value={confirm} onChange={e=>setConfirm(e.target.value)} className="mt-2 w-full rounded-xl border p-3 dark:bg-slate-800 dark:border-slate-600" placeholder="Repeat new password"/></label>
          {error && <p role="alert" className="rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 p-3 text-sm"><AlertCircle className="inline-block mr-2" size={16}/>{error}</p>}
          <button type="submit" disabled={busy} className="w-full rounded-xl bg-[#263577] text-white font-bold py-3.5 disabled:opacity-50">{busy?'Resetting…':'Reset Admin Password'}</button>
        </form>}
      </section><p className="mt-5 text-sm text-center text-slate-500"><Link to="/admin/login" className="underline">Back to Admin Login</Link></p>
    </div>
  </main>;
};
