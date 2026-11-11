import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';

/** One-time localhost-only provisioning of a real administrator. */
export const AdminSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  useEffect(() => {
    fetch('/api/auth/admin-setup-status', {credentials:'include',cache:'no-store'})
      .then(r=>r.json()).then(d=>setAllowed(d.setupAvailable === true)).catch(()=>setAllowed(false));
  }, []);
  if (allowed === null) return <div className="min-h-screen grid place-items-center text-slate-500">Checking administrator setup...</div>;
  if (!allowed) return <Navigate to="/admin/login" replace/>;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {setError('Use a password of at least 8 characters.');return;}
    if (password !== confirm) {setError('Passwords do not match.');return;}
    setPending(true); setError('');
    try {
      const r = await fetch('/api/auth/first-admin', {method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,email,password})});
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Unable to set up administrator.');
      navigate('/admin/login', {replace:true});
    } catch (err) {setError(err instanceof Error ? err.message : 'Setup failed.');}
    finally {setPending(false);}
  };
  return <main className="min-h-screen bg-[#f5f7fc] dark:bg-[#121827] flex items-center justify-center p-5 text-slate-900 dark:text-white">
    <div className="w-full max-w-md">
      <div className="flex flex-col items-center text-center mb-7"><div className="h-14 w-14 rounded-2xl bg-[#263577] text-white grid place-items-center mb-4"><ShieldCheck size={28}/></div>
        <p className="uppercase tracking-[0.2em] text-xs font-bold text-[#263577] dark:text-blue-300">EduShare Management</p>
        <h1 className="text-3xl font-bold mt-2">Create Your Admin Account</h1>
        <p className="text-sm mt-2 text-slate-500 dark:text-slate-400">Create the first administrator account to manage EduShare.</p></div>
      <form onSubmit={submit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-lg p-7 space-y-4">
        <div><label className="block text-sm font-semibold mb-2">Full name</label><input required autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" className="w-full rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-800 p-3"/></div>
        <div><label className="block text-sm font-semibold mb-2">Admin email</label><input required type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@yourdomain.com" className="w-full rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-800 p-3"/></div>
        <div><label className="block text-sm font-semibold mb-2">New password (8+ characters)</label><div className="relative"><input required minLength={8} type={show?'text':'password'} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Create a private password" className="w-full rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-800 p-3 pr-12"/><button type="button" className="absolute right-3 top-3 text-slate-500" aria-label={show?'Hide password':'Show password'} onClick={()=>setShow(!show)}>{show?<EyeOff size={20}/>:<Eye size={20}/>}</button></div></div>
        <div><label className="block text-sm font-semibold mb-2">Confirm password</label><input required minLength={8} type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Repeat password" className="w-full rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-800 p-3"/></div>
        {error && <p role="alert" className="rounded-lg bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 p-3 text-sm">{error}</p>}
        <button disabled={pending} className="w-full bg-[#263577] hover:bg-[#1d295f] disabled:opacity-60 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2">{pending?'Creating account...':'Create Admin Account'}<ArrowRight size={18}/></button>
      </form>
      <p className="text-center text-sm mt-5 text-slate-500">Already have an account? <Link className="underline" to="/admin/login">Administrator Sign In</Link> · <Link className="underline" to="/admin/recover">Recover password</Link></p>
    </div>
  </main>;
};
