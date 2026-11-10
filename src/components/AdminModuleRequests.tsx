import React,{useEffect,useState} from 'react';
import {useApp} from '../context/AppContext';
type Row={id:number;requestedBy:number;code:string;name:string;facultySubject:string;reason:string;status:string;adminNote:string;createdAt:string};
export function AdminModuleRequests({onReviewed}:{onReviewed:()=>void}) {
  const {users}=useApp();const [rows,setRows]=useState<Row[]>([]),[filter,setFilter]=useState('PENDING'),[notes,setNotes]=useState<Record<number,string>>({});
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState<number|null>(null),[error,setError]=useState('');
  const load=async(signal?:AbortSignal)=>{setLoading(true);try{const r=await fetch('/api/admin/module-requests',{credentials:'include',cache:'no-store',signal});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||'Could not load module requests.');if(!signal?.aborted){setRows(data);setError('');}}catch(e){if(!signal?.aborted)setError(e instanceof Error?e.message:'Could not load requests.');}finally{if(!signal?.aborted)setLoading(false);}};
  useEffect(()=>{const controller=new AbortController();void load(controller.signal);const timer=window.setInterval(()=>{void load(controller.signal);},15000);return()=>{controller.abort();window.clearInterval(timer);};},[]);
  const decide=async(row:Row,status:'APPROVED'|'REJECTED')=>{
    if(busy!==null)return;const note=(notes[row.id]||'').trim();if(status==='REJECTED'&&note.length<5){setError('Please explain why this module request is being rejected (at least 5 characters).');return;}
    setBusy(row.id);setError('');try{const response=await fetch(`/api/admin/module-requests/${row.id}/decision`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({status,note})});const result=await response.json().catch(()=>({}));if(!response.ok)throw new Error(result.error||'Could not save the decision.');await load();onReviewed();}catch(e){setError(e instanceof Error?e.message:'Could not save the decision.');}finally{setBusy(null);}
  };
  const visible=rows.filter(r=>filter==='ALL'||r.status===filter).slice().reverse();
  return <section aria-label="Module requests" className="space-y-5 max-w-5xl">
    <div className="flex flex-wrap gap-3 items-center justify-between"><div><h3 className="text-xl font-bold">Module requests ({rows.filter(r=>r.status==='PENDING').length} pending)</h3><p className="text-sm text-neutral-600 dark:text-neutral-300">Review the code, name and subject. Approval adds or activates the module in the upload form and notifies the requester.</p></div><button type="button" disabled={loading} onClick={()=>void load()} className="rounded-full border px-4 py-2 font-bold">Refresh requests</button></div>
    <label className="block text-sm font-semibold">Request status<select value={filter} onChange={e=>setFilter(e.target.value)} className="ml-3 rounded-xl border px-3 py-2 bg-white dark:bg-neutral-800"><option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option><option value="ALL">All requests</option></select></label>
    {error&&<p role="alert" className="text-red-700 dark:text-red-300">{error}</p>}{loading&&<p role="status">Loading requests…</p>}
    {!loading&&!visible.length&&<p>No matching module requests.</p>}
    {visible.map(row=><article key={row.id} className="rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5 space-y-3">
      <div><h4 className="font-bold">{row.code} — {row.name}</h4><p className="text-sm">{row.facultySubject} · {users.find(u=>u.id===`backend-user-${row.requestedBy}`)?.name||'Member'} · {new Date(row.createdAt).toLocaleDateString()}</p></div>
      <p className="text-sm whitespace-pre-wrap">{row.reason}</p><p className="text-sm font-bold">{row.status}</p>
      {row.status==='PENDING'?<><label className="block text-sm font-semibold">Reply to the requester (required for rejection)<textarea maxLength={500} value={notes[row.id]||''} onChange={e=>setNotes({...notes,[row.id]:e.target.value})} className="mt-1 block w-full rounded-xl border p-3 bg-white dark:bg-neutral-800"/></label><div className="flex flex-wrap gap-3"><button type="button" disabled={busy!==null} onClick={()=>void decide(row,'APPROVED')} className="rounded-full bg-emerald-700 text-white px-5 py-2 font-bold disabled:opacity-50">{busy===row.id?'Saving…':'Approve and add module'}</button><button type="button" disabled={busy!==null} onClick={()=>void decide(row,'REJECTED')} className="rounded-full border border-red-500 text-red-700 dark:text-red-300 px-5 py-2 font-bold disabled:opacity-50">Reject request</button></div></>:<p className="text-sm">Administrator: {row.adminNote}</p>}
    </article>)}
  </section>;
}
