import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../components/auth/AuthLayout.tsx';
export const EmailResetPasswordPage: React.FC = () => {
  const [params] = useSearchParams();const token=params.get('token')||'';
  const [password,setPassword]=useState('');const [confirm,setConfirm]=useState('');
  const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [error,setError]=useState('');
  const submit=async(e:React.FormEvent)=>{e.preventDefault();setError('');setMessage('');
    if(password!==confirm){setError('Passwords do not match.');return;}
    if(password.length<8||password.length>128||!/[a-zA-Z]/.test(password)||!/[0-9]/.test(password)){setError('Use 8–128 characters with letters and numbers.');return;}
    setBusy(true);try {const response=await fetch('/api/email-auth/reset',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,password})});
      const body=await response.json().catch(()=>({}));if(!response.ok)throw new Error(body.error||'Reset failed');setMessage(body.message||'Password updated.');setPassword('');setConfirm('');
    }catch(ex){setError(ex instanceof Error?ex.message:'Could not reset password.');}finally{setBusy(false);}
  };
  return <AuthLayout><div className="mx-auto max-w-lg space-y-5 text-gray-900 dark:text-white"><h1 className="text-3xl font-bold">Set New Password</h1>
    <p className="text-gray-600 dark:text-gray-300">This email link can be used once and expires after 30 minutes.</p>
    <p className="text-sm text-gray-600 dark:text-gray-300">Use 8–128 characters, including at least one letter and one number.</p>
    <form onSubmit={submit} className="space-y-4"><label className="block">New password<input type="password" minLength={8} maxLength={128} required value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" className="w-full border rounded-xl p-3 bg-white text-gray-900 dark:bg-gray-800 dark:text-white" /></label>
    <label className="block">Confirm new password<input type="password" minLength={8} maxLength={128} required value={confirm} onChange={e=>setConfirm(e.target.value)} autoComplete="new-password" className="w-full border rounded-xl p-3 bg-white text-gray-900 dark:bg-gray-800 dark:text-white" /></label>
    <button type="submit" disabled={busy||!token} className="w-full rounded-full bg-[#FF4A00] text-white font-bold p-3 disabled:opacity-50">{busy?'Resetting...':'Reset Password'}</button></form>
    {error&&<p role="alert" className="text-red-600">{error}</p>}{message&&<p role="status" className="text-green-700 dark:text-green-300">{message}</p>}
    <Link to="/login" className="font-bold text-orange-600">Back to Login</Link></div></AuthLayout>;
};
