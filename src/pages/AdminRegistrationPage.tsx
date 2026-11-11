import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AdminRegistrationPage: React.FC = () => {
  const { currentUser, authReady } = useApp();
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', confirm: '', adminPassword: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState('');
  const update = (key: keyof typeof form, value: string) => setForm(previous => ({ ...previous, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (form.password !== form.confirm) { setError('The new passwords do not match.'); return; }
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/admin/accounts/register', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), username: form.username.trim(), email: form.email.trim(), password: form.password, adminPassword: form.adminPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not create the administrator.');
      setCreated(data.email || form.email.trim());
      setForm({ name: '', username: '', email: '', password: '', confirm: '', adminPassword: '' });
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Please try again.'); }
    finally { setBusy(false); }
  };
  const inputClass = 'w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-3 text-slate-900 dark:text-white';
  return <main className="min-h-screen bg-[#f5f7fc] dark:bg-[#121827] p-5 sm:p-8 text-slate-900 dark:text-white">
    <div className="max-w-xl mx-auto py-8 sm:py-12">
      <Link to={currentUser?.role === 'admin' ? '/admin/dashboard' : '/admin/login'} className="inline-flex items-center gap-2 text-sm font-semibold text-[#263577] dark:text-blue-300 mb-7"><ArrowLeft size={17} />{currentUser?.role === 'admin' ? 'Back to Admin Dashboard' : 'Back to Admin Sign In'}</Link>
      <div className="mb-7"><ShieldCheck className="text-[#263577] dark:text-blue-300 mb-3" size={34} /><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#263577] dark:text-blue-300">EduShare Management</p><h1 className="text-3xl font-bold mt-2">Register an Administrator</h1><p className="text-slate-600 dark:text-slate-300 mt-3">Add another team member with administrator access. Each person uses their own account.</p></div>
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 shadow-sm">
        {!authReady ? <p role="status">Checking your account…</p> : currentUser?.role !== 'admin' ? <div className="space-y-4"><h2 className="text-xl font-bold">Administrator approval required</h2><p className="text-slate-600 dark:text-slate-300">An existing administrator must sign in to create another administrator account.</p><Link to="/admin/login" state={{ from: '/admin/register' }} className="inline-block rounded-xl bg-[#263577] text-white px-5 py-3 font-semibold">Sign in as an administrator</Link></div> : created ? <div className="space-y-4" role="status"><CheckCircle2 className="text-emerald-600" size={36} /><h2 className="text-xl font-bold">Administrator account created</h2><p>A verification email was sent to <strong className="break-all">{created}</strong>. The new administrator must verify that email before signing in.</p><p className="text-sm text-slate-500 dark:text-slate-300">You are still signed in to your current administrator account.</p><button type="button" onClick={() => setCreated('')} className="rounded-xl bg-[#263577] text-white px-5 py-3 font-semibold">Add another administrator</button></div> : <form onSubmit={submit} className="space-y-5">
          <fieldset disabled={busy} className="space-y-5">
            <div><label htmlFor="new-admin-name" className="block font-semibold text-sm mb-2">Full name</label><input id="new-admin-name" className={inputClass} required maxLength={100} autoComplete="name" value={form.name} onChange={event => update('name', event.target.value)} /></div>
            <div><label htmlFor="new-admin-username" className="block font-semibold text-sm mb-2">Username</label><input id="new-admin-username" className={inputClass} required minLength={3} maxLength={40} pattern="[a-zA-Z0-9_.-]{3,40}" autoComplete="off" value={form.username} onChange={event => update('username', event.target.value)} /></div>
            <div><label htmlFor="new-admin-email" className="block font-semibold text-sm mb-2">University or personal email</label><input id="new-admin-email" className={inputClass} required type="email" maxLength={254} autoComplete="off" value={form.email} onChange={event => update('email', event.target.value)} /></div>
            <div><label htmlFor="new-admin-password" className="block font-semibold text-sm mb-2">New administrator's password</label><input id="new-admin-password" className={inputClass} required type="password" minLength={8} maxLength={128} autoComplete="new-password" value={form.password} onChange={event => update('password', event.target.value)} /><p className="text-xs text-slate-500 dark:text-slate-300 mt-2">8–128 characters, including a letter and a number.</p></div>
            <div><label htmlFor="new-admin-confirm" className="block font-semibold text-sm mb-2">Confirm new password</label><input id="new-admin-confirm" className={inputClass} required type="password" autoComplete="new-password" value={form.confirm} onChange={event => update('confirm', event.target.value)} /></div>
            <div className="border-t border-slate-200 dark:border-slate-700 pt-5"><label htmlFor="acting-admin-password" className="block font-semibold text-sm mb-2">Your current administrator password</label><input id="acting-admin-password" className={inputClass} required type="password" autoComplete="current-password" value={form.adminPassword} onChange={event => update('adminPassword', event.target.value)} /><p className="text-xs text-slate-500 dark:text-slate-300 mt-2">Confirm that you authorize this new administrator.</p></div>
          </fieldset>
          {error && <p role="alert" className="rounded-xl bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 p-3 text-sm">{error}</p>}
          <button disabled={busy} type="submit" className="w-full rounded-xl bg-[#263577] text-white py-3.5 font-bold disabled:opacity-60">{busy ? 'Creating administrator…' : 'Create Administrator Account'}</button>
        </form>}
      </section>
    </div>
  </main>;
};
