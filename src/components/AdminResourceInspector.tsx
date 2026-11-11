import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock3, ExternalLink, FileText, RefreshCw, ShieldCheck, ShieldX } from 'lucide-react';
import { Modal } from './shared/Modal.tsx';

type HistoryEntry = {resourceId:number;adminId:number;before:string;after:string;reason:string;timestamp:string};
type ResourceDetails = {
  id:number;title:string;uploaderEmail:string;resourceType:string;status:string;category:string;
  moduleCode:string;description:string;academicYear:string;semester:string;priceType:string;
  pages:number;fileName:string;previewUrl:string;history:HistoryEntry[];
};

type Props = {
  resource: {id:number; title:string} | null;
  onClose:()=>void;
  onChanged:()=>Promise<void> | void;
};

/** Full admin inspection: real stored PDF, metadata, decision reason, audit trail. */
export const AdminResourceInspector:React.FC<Props> = ({resource,onClose,onChanged}) => {
  const [details,setDetails] = useState<ResourceDetails|null>(null);
  const [loading,setLoading] = useState(false);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState('');
  const [reason,setReason] = useState('');
  const [previewFailed,setPreviewFailed] = useState(false);
  const [key,setKey] = useState(0);

  const getDetails = async(id:number) => {
    setLoading(true);setError('');
    try {
      const r=await fetch(`/api/admin/resource-moderation/${id}`,{credentials:'include',cache:'no-store'});
      if(!r.ok) throw new Error(`Unable to inspect resource (HTTP ${r.status}).`);
      setDetails(await r.json());
    } catch(e){setDetails(null);setError(e instanceof Error?e.message:'Unable to load resource');}
    finally{setLoading(false);}
  };
  useEffect(()=>{
    setDetails(null);setReason('');setError('');setPreviewFailed(false);
    if(resource)void getDetails(resource.id);
  },[resource?.id]);

  const decide = async(status:'APPROVED'|'REJECTED'|'PENDING')=>{
    if(!details || saving)return;
    if(reason.trim().length<10 || reason.trim().length>1000){setError('Enter a decision reason between 10 and 1000 characters.');return;}
    if(!window.confirm(`Set this resource to ${status}? The decision and your review reason will be saved.`))return;
    setSaving(true);setError('');
    try {
      const r=await fetch(`/api/admin/resource-moderation/${details.id}/decision`,{
        method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({status,reason:reason.trim(),expectedStatus:details.status}),
      });
      if(!r.ok){const b=await r.json().catch(()=>({}));throw new Error(b.error||`Moderation failed (HTTP ${r.status}).`)}
      const updated:ResourceDetails=await r.json();setDetails(updated);setReason('');
      await onChanged();
    }catch(e){setError(e instanceof Error?e.message:'Decision failed');}
    finally{setSaving(false);}
  };
  const pill=(s:string)=>s.toUpperCase()==='APPROVED'?'bg-emerald-100 text-emerald-800':s.toUpperCase()==='REJECTED'?'bg-rose-100 text-rose-800':'bg-amber-100 text-amber-800';

  return <Modal isOpen={!!resource} onClose={()=>{if(!saving)onClose()}} title="Resource Inspection & Moderation"
      description="Review the actual uploaded document before making a recorded decision." maxWidth="4xl">
    <div className="space-y-5 text-neutral-900 dark:text-neutral-100">
      {loading&&<p className="text-sm">Loading resource details…</p>}
      {error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-200">{error}</p>}
      {details&&<>
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div><h3 className="font-bold text-lg">{details.title}</h3><p className="text-xs text-neutral-500 dark:text-neutral-300">Resource #{details.id} · {details.moduleCode} · {details.category}</p></div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${pill(details.status)}`}>{details.status}</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 text-xs">
          <p><strong>Uploader:</strong> {details.uploaderEmail}</p>
          <p><strong>Type:</strong> {details.resourceType}</p>
          <p><strong>Academic year:</strong> {details.academicYear||'Not specified'}</p>
          <p><strong>Semester:</strong> {details.semester||'Not specified'}</p>
          <p><strong>Pricing:</strong> {details.priceType}</p>
          <p><strong>Pages:</strong> {details.pages||'Not specified'}</p>
          <p className="sm:col-span-2"><strong>Description:</strong> {details.description||'Not provided'}</p>
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap justify-between gap-3 items-center"><h4 className="text-sm font-bold flex items-center gap-2"><FileText size={16}/> Actual PDF Preview</h4>
            <div className="flex flex-wrap gap-3"><a href={details.previewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline text-blue-500 text-xs"><ExternalLink size={14}/> Open in new tab</a>
              <button type="button" onClick={()=>{setKey(v=>v+1);setPreviewFailed(false)}} className="flex items-center gap-1 text-xs text-[#FF4A00]"><RefreshCw size={14}/> Reload</button></div></div>
          <iframe key={key} src={`${details.previewUrl}#toolbar=1`} title={`PDF preview: ${details.title}`} onError={()=>setPreviewFailed(true)} className="h-[min(48vh,500px)] min-h-[260px] w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white"/>
          <p className="text-xs text-neutral-500 dark:text-neutral-300">If the preview does not appear, use Open PDF to review the document in a new tab.</p>
          {previewFailed&&<p className="text-rose-600 text-xs">PDF preview unavailable. Open and review the document before approving.</p>}
        </div>
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 space-y-3">
          <div className="flex items-center gap-2"><ShieldCheck size={17} className="text-emerald-600"/><h4 className="font-bold text-sm">Admin Moderation Decision</h4></div>
          <p className="text-xs text-neutral-500 dark:text-neutral-300">PENDING = awaiting review; APPROVED = visible to students; REJECTED = hidden from public Browse. Rejected content is preserved for an appeal or re-review. This is a manual review, not an automatic plagiarism scan.</p>
          <label className="block text-xs font-bold" htmlFor="admin-moderation-reason">Decision reason (required, 10–1000 characters)</label>
          <textarea id="admin-moderation-reason" value={reason} onChange={e=>setReason(e.target.value)} rows={3} maxLength={1000}
            placeholder="Summarize the document, academic integrity/copyright checks, and reason for this decision…"
            className="w-full rounded-xl border border-neutral-300 dark:border-neutral-600 p-3 bg-white dark:bg-neutral-800 text-sm"/>
          <div className="flex flex-wrap gap-2">
            {details.status!=='APPROVED'&&<button disabled={saving} onClick={()=>void decide('APPROVED')} className="rounded-full bg-emerald-600 text-white px-4 py-2 text-xs font-bold disabled:opacity-50 flex items-center gap-1"><CheckCircle2 size={15}/> Approve / Reapprove</button>}
            {details.status!=='REJECTED'&&<button disabled={saving} onClick={()=>void decide('REJECTED')} className="rounded-full bg-rose-600 text-white px-4 py-2 text-xs font-bold disabled:opacity-50 flex items-center gap-1"><ShieldX size={15}/> Reject / Take Down</button>}
            {details.status!=='PENDING'&&<button disabled={saving} onClick={()=>void decide('PENDING')} className="rounded-full border border-amber-500 text-amber-600 px-4 py-2 text-xs font-bold disabled:opacity-50 flex items-center gap-1"><Clock3 size={15}/> Return to Review</button>}
          </div>
        </div>
        <div className="space-y-2"><h4 className="text-sm font-bold">Moderation History ({details.history.length})</h4>
          {details.history.length===0?<p className="text-xs text-neutral-500 dark:text-neutral-300">No recorded moderation decisions for this resource. Older imported/approved records may not have a history entry.</p>:
          details.history.slice().reverse().map((h,i)=><div key={i} className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs space-y-1">
            <p className="font-bold">{h.before} → {h.after} <span className="font-normal text-neutral-500">· Admin #{h.adminId} · {h.timestamp.replace('T',' ').slice(0,19)} UTC</span></p>
            <p className="whitespace-pre-wrap break-words">{h.reason}</p>
          </div>)}
        </div>
      </>}
    </div>
  </Modal>;
};
