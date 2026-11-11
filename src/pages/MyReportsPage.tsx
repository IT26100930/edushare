import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, FileWarning, RefreshCw, Send } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

type MyReport = {id:string; resourceId:number; targetTitle:string; reason:string; date:string; status:string};
const statusLabel:Record<string,string>={pending:'Under Admin Review',needs_evidence:'Evidence Requested',resolved:'Taken Down',dismissed:'Dismissed',restored:'Restored'};
export const MyReportsPage:React.FC = ()=>{
 const {addToast}=useApp(); const [params]=useSearchParams();const selected=params.get('report');
 const [reports,setReports]=useState<MyReport[]>([]), [loading,setLoading]=useState(true),[error,setError]=useState('');
 const [url,setUrl]=useState<Record<string,string>>({}),[details,setDetails]=useState<Record<string,string>>({}),[busy,setBusy]=useState<string|null>(null);
 const load=async()=>{
  try {setError('');const response=await fetch('/api/reports/mine',{credentials:'include',cache:'no-store'});
   if(!response.ok)throw new Error('Could not load your reports. Please sign in again.');
   const rows:MyReport[]=await response.json();setReports(rows.slice().reverse());
  }catch(e){setError(e instanceof Error?e.message:'Could not load reports');}finally{setLoading(false)}
 };
 useEffect(()=>{void load()},[]);
 useEffect(()=>{if(selected&&!loading){document.getElementById(`my-report-${selected}`)?.scrollIntoView({behavior:'smooth',block:'center'})}},[selected,loading,reports.length]);
 const submit=async(report:MyReport)=>{
   if((!url[report.id]?.trim())&&(details[report.id]?.trim().length||0)<10){setError('Provide a valid URL or at least 10 characters of evidence details.');return;}
   setBusy(report.id);setError('');
   try {const response=await fetch(`/api/reports/${report.id}/evidence`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({evidenceUrl:url[report.id]||'',details:details[report.id]||''})});
     if(!response.ok){const x=await response.json().catch(()=>({}));throw new Error(x.error||`HTTP ${response.status}`)}
     setUrl(prev=>({...prev,[report.id]:''}));setDetails(prev=>({...prev,[report.id]:''}));
     addToast({title:'Evidence submitted',message:'Your report returned to the admin review queue.',type:'success'}); await load();
   }catch(e){setError(e instanceof Error?e.message:'Evidence submission failed');}finally{setBusy(null)}
 };
 return <main className="mx-auto max-w-5xl px-4 sm:px-8 py-10 text-neutral-900 dark:text-white">
  <div className="flex flex-wrap justify-between gap-3 items-start mb-8"><div><p className="text-[#FF4A00] text-xs font-bold uppercase tracking-widest">My EduShare</p><h1 className="text-3xl font-display font-bold mt-1">My Reports & Evidence</h1><p className="text-sm text-neutral-500 dark:text-neutral-300 mt-2">Track your resource reports, respond to evidence requests, and follow the admin's decision.</p></div>
   <button type="button" onClick={()=>void load()} className="flex gap-2 items-center rounded-full border px-4 py-2 text-sm"><RefreshCw size={16}/> Refresh</button></div>
  {error&&<p role="alert" className="mb-5 rounded-xl bg-red-50 text-red-700 p-3 text-sm">{error}</p>}
  {loading?<p>Loading reports...</p>:reports.length===0?<div className="rounded-3xl border dark:border-neutral-800 p-8 text-center"><FileWarning className="mx-auto mb-4"/><p className="font-semibold">No resource reports yet.</p><Link to="/browse" className="mt-4 inline-block text-[#FF4A00] underline">Browse resources</Link></div>:<div className="space-y-5">
    {reports.map(report=><section id={`my-report-${report.id}`} key={report.id} className={`rounded-3xl border p-5 sm:p-7 bg-white dark:bg-[#1C2029] ${selected===report.id?'border-[#FF4A00] ring-2 ring-orange-100':'border-neutral-200 dark:border-neutral-700'}`}>
      <div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-extrabold text-lg">{report.targetTitle}</h2><p className="text-xs text-neutral-500 mt-1">Report #{report.id} · {report.date.slice(0,10)}</p></div>
        <span className={`h-fit text-xs font-bold px-3 py-1.5 rounded-full ${report.status==='needs_evidence'?'bg-amber-100 text-amber-900':'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-white'}`}>{statusLabel[report.status]||report.status}</span></div>
      <p className="text-sm mt-4"><strong>Reason:</strong> {report.reason}</p>
      <Link to={`/resource/${report.resourceId<0?'backend-link-'+(-report.resourceId):'backend-resource-'+report.resourceId}`} className="text-[#FF4A00] text-sm underline inline-block mt-3">View reported resource</Link>
      {report.status==='needs_evidence'&&<form onSubmit={e=>{e.preventDefault();void submit(report)}} className="mt-5 p-4 sm:p-5 rounded-2xl border border-amber-200 bg-amber-50 dark:bg-[#2C281D] dark:border-amber-900 space-y-3">
        <h3 className="flex gap-2 items-center font-bold text-amber-900 dark:text-amber-200"><AlertCircle size={18}/> Administrator requested more evidence</h3>
        <p className="text-sm text-amber-900 dark:text-amber-100">Include an original source URL and explain why it supports the report. You can provide written evidence without a link.</p>
        <label className="text-xs font-bold block">Original Source URL (optional)<input type="url" maxLength={700} placeholder="https://..." value={url[report.id]||''} onChange={e=>setUrl(p=>({...p,[report.id]:e.target.value}))} className="block mt-1 w-full rounded-xl border border-amber-200 p-3 text-neutral-900 bg-white"/></label>
        <label className="text-xs font-bold block">Evidence Details<textarea maxLength={1200} rows={4} placeholder="Explain where the material originated and what should be checked..." value={details[report.id]||''} onChange={e=>setDetails(p=>({...p,[report.id]:e.target.value}))} className="block mt-1 w-full rounded-xl border border-amber-200 p-3 text-neutral-900 bg-white"/></label>
        <button type="submit" disabled={busy===report.id} className="inline-flex items-center gap-2 rounded-full bg-[#FF4A00] text-white px-5 py-3 text-sm font-bold disabled:opacity-50"><Send size={15}/>{busy===report.id?'Submitting...':'Submit Evidence'}</button>
      </form>}
      {report.status==='pending'&&<p className="mt-4 text-xs text-neutral-500 flex items-center gap-2"><CheckCircle2 size={14}/> Awaiting administrator review.</p>}
    </section>)}
  </div>}
 </main>
};
