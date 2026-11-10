import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { validateLoginEmail } from '../utils/authValidation.ts';

/** Dedicated administrator authentication. Access is always verified server-side. */
export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const destination = location.state?.from === '/admin/register' ? '/admin/register' : '/admin/dashboard';
  const { currentUser, authReady, acceptAuthenticatedUser, addToast } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [setupAvailable, setSetupAvailable] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/admin-setup-status', {credentials: 'include', cache: 'no-store'})
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!active || !data) return;
        if (typeof data.adminEmail === 'string') setAdminEmail(data.adminEmail);
        setSetupAvailable(data.setupAvailable === true);
      }).catch(() => {});
    return () => { active = false; };
  }, []);

  if (authReady && currentUser?.role === 'admin') return <Navigate to={destination} replace />;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateLoginEmail(email) || !password) { setError('Enter a valid email and password.'); return; }
    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST', credentials: 'include',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({email:email.trim(), password})
      });
      if (!response.ok) throw new Error('Invalid administrator credentials or insufficient permissions.');
      const account = await response.json();
      if (account.role?.toUpperCase() !== 'ADMIN') throw new Error('Administrator access required.');
      acceptAuthenticatedUser(account);
      addToast({title:'Welcome to EduShare Admin', message:'You are signed in securely.', type:'success'});
      navigate(destination, {replace:true});
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to sign in.');
    } finally {setPending(false);}
  };

  return <div className="min-h-screen flex items-center justify-center bg-[#f5f7fc] dark:bg-[#121827] p-5 sm:p-8 text-slate-900 dark:text-white">
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-[#263577] text-white shadow-lg mb-5"><ShieldCheck size={32}/></div>
        <div className="uppercase tracking-[0.24em] text-xs font-bold text-[#263577] dark:text-blue-300">EduShare Management</div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Administrator Sign In</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Secure access for authorized administrators only.</p>
      </div>
      <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-7 sm:p-9 shadow-xl">
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label htmlFor="admin-email" className="block text-sm font-semibold mb-2">Admin Email</label>
            <div className="relative"><Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400"/>
              <input id="admin-email" type="email" autoComplete="username" required value={email} onChange={e=>{setEmail(e.target.value);setError('');}} placeholder="admin@yourdomain.com" className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-11 py-3 outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
          </div>
          <div>
            <label htmlFor="admin-password" className="block text-sm font-semibold mb-2">Password</label>
            <div className="relative"><LockKeyhole className="absolute left-4 top-3.5 w-5 h-5 text-slate-400"/>
              <input id="admin-password" type={visible?'text':'password'} autoComplete="current-password" required value={password} onChange={e=>{setPassword(e.target.value);setError('');}} placeholder="Enter your password" className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 pl-11 pr-12 py-3 outline-none focus:ring-2 focus:ring-blue-500"/>
              <button type="button" aria-label={visible?'Hide password':'Show password'} onClick={()=>setVisible(!visible)} className="absolute right-3 top-3 p-1 text-slate-500">{visible?<EyeOff size={19}/>:<Eye size={19}/>}</button>
            </div>
          </div>
          {error && <div role="alert" className="rounded-xl bg-red-50 dark:bg-red-950/30 p-3 text-red-700 dark:text-red-300 text-sm">{error}</div>}
          <button disabled={pending || !authReady} type="submit" className="w-full rounded-xl bg-[#263577] hover:bg-[#1d295f] disabled:opacity-60 text-white font-bold py-3.5 flex items-center justify-center gap-2 transition-colors">{pending?'Signing in...':'Sign in to Dashboard'}<ArrowRight size={18}/></button>
        </form>
        {adminEmail && <div className="mt-6 rounded-2xl border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20 p-4 text-sm">
          <p className="font-bold text-[#263577] dark:text-blue-300">Administrator account</p>
          <p className="mt-1 text-slate-600 dark:text-slate-300">This account is configured on this computer. Use the password selected when it was created.</p>
          <div className="mt-3 flex items-center justify-between gap-2"><span className="font-semibold break-all">{adminEmail}</span>
            <button type="button" onClick={()=>{setEmail(adminEmail);setError('')}} className="shrink-0 font-semibold text-[#263577] dark:text-blue-300 hover:underline">Use email</button>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Use your registered administrator account to sign in.</p>
        </div>}
        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">Forgot your administrator password? <Link to="/admin/recover" className="font-bold text-[#263577] dark:text-blue-300 underline">Recover access</Link></p>
        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-300">Add another administrator? <Link to="/admin/register" className="font-bold text-[#263577] dark:text-blue-300 underline">Register an Administrator</Link></p>
        {setupAvailable && <div className="mt-5 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 text-sm">
          <p className="font-semibold">First-time setup</p>
          <p className="mt-1 text-slate-500 dark:text-slate-400">No real admin account found. Create your own administrator account on this computer.</p>
          <Link className="mt-3 inline-block font-bold text-[#263577] dark:text-blue-300 underline" to="/admin/setup">Create Administrator Account</Link>
        </div>}

      </div>
      <p className="mt-7 text-center text-xs text-slate-500 dark:text-slate-400">Admin access is monitored by the server. <Link to="/" className="underline hover:text-[#263577]">Back to EduShare</Link></p>
    </div>
  </div>;
};
