import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../components/auth/AuthLayout.tsx';
export const VerifyEmailPage: React.FC = () => {
  const [params] = useSearchParams(); const [message,setMessage]=useState('Verifying your email...');
  const token=params.get('token');
  const [email,setEmail]=useState('');const [resend,setResend]=useState('');
  useEffect(()=>{
    if(!token) {setMessage('Verification link is missing.');return;}
    fetch('/api/email-auth/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})})
      .then(async r=>{const d=await r.json().catch(()=>({}));setMessage(r.ok?(d.message||'Email verified.'):(d.error||'Verification failed.'));})
      .catch(()=>setMessage('Unable to reach EduShare. Please try again.'));
  },[token]);
  return <AuthLayout><div className="mx-auto max-w-lg space-y-6 text-gray-900 dark:text-white"><h1 className="text-3xl font-bold">Email Verification</h1><p role="status">{message}</p>
    <form className="space-y-2" onSubmit={async e=>{e.preventDefault();try{const r=await fetch('/api/email-auth/resend-verification',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})});const d=await r.json();setResend(d.message||d.error||'Please try later.');}catch{setResend('Email service unavailable.');}}}>
      <label className="block text-sm">Need a new verification link?<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Your registered email" className="mt-2 w-full border rounded-xl p-3 text-gray-900 dark:text-white dark:bg-gray-800" /></label>
      <button type="submit" className="rounded-full bg-orange-600 px-5 py-2 text-white font-bold">Resend Verification Email</button>
      {resend&&<p role="status">{resend}</p>}
    </form><Link to="/login" className="font-bold text-orange-600">Go to Login</Link></div></AuthLayout>;
};
