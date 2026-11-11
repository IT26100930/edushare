import React,{useEffect,useRef,useState} from 'react';
import {useLocation} from 'react-router-dom';
import {Modal} from './shared/Modal';

type RequestRow={id:number;code:string;name:string;facultySubject:string;reason:string;status:string;adminNote:string};
export function ModuleRequestAccess({defaultSubject='',autoOpenOnly=false}:{defaultSubject?:string;autoOpenOnly?:boolean}) {
  const location=useLocation();const [open,setOpen]=useState(false),[rows,setRows]=useState<RequestRow[]>([]);
  const [subjects,setSubjects]=useState<string[]>([]),[subject,setSubject]=useState(defaultSubject),[code,setCode]=useState(''),[name,setName]=useState(''),[reason,setReason]=useState('');
  const [busy,setBusy]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  const approved=useRef(new Set<number>());
  useEffect(()=>{if(autoOpenOnly&&new URLSearchParams(location.search).has('module-request'))setOpen(true);},[autoOpenOnly,location.search]);
  const load=async(signal?:AbortSignal)=>{
    setLoading(true);
    try {
      const response=await fetch('/api/module-requests',{credentials:'include',cache:'no-store',signal});
      const result=await response.json().catch(()=>({}));if(!response.ok)throw new Error(result.error||'Could not load your module requests.');
      if(signal?.aborted)return;setRows(result);setError('');
      if(result.some((r:RequestRow)=>r.status==='APPROVED'&&!approved.current.has(r.id)))window.dispatchEvent(new Event('edushare:modules-updated'));
      result.filter((r:RequestRow)=>r.status==='APPROVED').forEach((r:RequestRow)=>approved.current.add(r.id));
    }catch(e){if(!signal?.aborted)setError(e instanceof Error?e.message:'Could not load requests.');}
    finally{if(!signal?.aborted)setLoading(false);}
  };
  useEffect(()=>{
    if(!open)return;const controller=new AbortController();void load(controller.signal);
    fetch('/api/categories',{credentials:'include',signal:controller.signal}).then(async r=>{if(!r.ok)throw new Error('Could not load subjects.');return r.json();}).then(values=>{
      if(controller.signal.aborted)return;const options=values.map((c:{name:string})=>c.name);setSubjects(options);setSubject(old=>options.includes(old)?old:options.includes(defaultSubject)?defaultSubject:options[0]||'');
    }).catch(e=>{if(!controller.signal.aborted)setError(e.message);});
    const timer=window.setInterval(()=>{void load(controller.signal);},15000);
    return()=>{controller.abort();window.clearInterval(timer);};
  },[open]);
  const submit=async(e:React.FormEvent)=>{
    e.preventDefault();if(busy)return;setBusy(true);setError('');setMessage('');
    try {
      const response=await fetch('/api/module-requests',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:code.trim(),name:name.trim(),facultySubject:subject,reason:reason.trim()})});
      const result=await response.json().catch(()=>({}));if(!response.ok)throw new Error(result.error||'Your request could not be sent.');
      setCode('');setName('');setReason('');await load();setMessage('Request sent. Administrators will see it in Module requests. Your notification bell will show their decision.');
    }catch(e){setError(e instanceof Error?e.message:'Request could not be sent.');}
    finally{setBusy(false);}
  };
  return <>
    {!autoOpenOnly&&<div className="mt-2 space-y-1"><button type="button" onClick={()=>setOpen(true)} className="text-sm font-bold text-[#263577] dark:text-blue-200 underline underline-offset-4">Request a missing module</button><p className="text-xs text-neutral-600 dark:text-neutral-300">Send the code and name to an administrator, or check your previous requests.</p></div>}
    <Modal isOpen={open} onClose={()=>{if(!busy)setOpen(false);}} title="Request a missing module" maxWidth="2xl">
      <div className="space-y-5 text-neutral-900 dark:text-neutral-100">
        <p className="text-sm">An administrator must review the request before the module appears in the upload form. This does not publish a module immediately.</p>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-sm font-semibold">Module code<input required minLength={2} maxLength={20} value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="e.g. IT2050" className="mt-1 w-full rounded-xl border p-3 bg-white dark:bg-neutral-800"/></label>
            <label className="text-sm font-semibold">Module name<input required minLength={3} maxLength={140} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Computer Networks" className="mt-1 w-full rounded-xl border p-3 bg-white dark:bg-neutral-800"/></label>
          </div>
          <label className="block text-sm font-semibold">Faculty subject<select required value={subject} onChange={e=>setSubject(e.target.value)} className="mt-1 w-full rounded-xl border p-3 bg-white dark:bg-neutral-800"><option value="">Choose a subject</option>{subjects.map(s=><option key={s}>{s}</option>)}</select></label>
          <label className="block text-sm font-semibold">Why is this module needed?<textarea required minLength={10} maxLength={500} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Mention your course or the resources you want to share." className="mt-1 w-full rounded-xl border p-3 bg-white dark:bg-neutral-800"/></label>
          <button disabled={busy||!subjects.length} className="rounded-full bg-[#263577] text-white px-5 py-2.5 text-sm font-bold disabled:opacity-50">{busy?'Sending…':'Send module request'}</button>
        </form>
        {error&&<p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
        {message&&<p role="status" className="text-sm text-emerald-800 dark:text-emerald-200">{message}</p>}
        <div className="flex items-center justify-between gap-3 border-t pt-4"><h3 className="font-bold">My module requests</h3><button type="button" disabled={loading} onClick={()=>void load()} className="text-sm underline">Refresh requests</button></div>
        {loading&&<p role="status" className="text-sm">Checking requests…</p>}
        {!loading&&!rows.length&&<p className="text-sm">No module requests yet.</p>}
        <div className="space-y-3">{rows.slice().reverse().map(row=><article key={row.id} className={`rounded-xl border p-4 shared-link-${row.status==='APPROVED'?'approved':row.status==='REJECTED'?'rejected':'pending'}`}><h4 className="font-bold">{row.code} — {row.name}</h4><p className="text-sm font-semibold mt-1">{row.status==='APPROVED'?'Approved · module available':row.status==='REJECTED'?'Rejected':'Pending administrator review'}</p>{row.adminNote&&<p className="text-sm mt-2">Administrator: {row.adminNote}</p>}</article>)}</div>
      </div>
    </Modal>
  </>;
}
