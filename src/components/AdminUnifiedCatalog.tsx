import {LinkSubjectEditor} from './LinkSubjectEditor';
import React, { useCallback, useEffect, useState } from 'react';
import { Modal } from './shared/Modal.tsx';
import { AdminResourceInspector } from './AdminResourceInspector.tsx';

type Entry = { ownedVideo?:boolean;ownership?:string;priceType?:string;price?:number; key: string; id: number; title: string; kind: 'PDF' | 'VIDEO' | 'ARTICLE'; uploaderEmail: string; moduleCode?: string; url?: string; status: string; moderationReason?: string; hidden?: boolean };
export function AdminUnifiedCatalog({ onChanged, onDeletePDF }: { onChanged: () => Promise<void> | void; onDeletePDF: (resource: { id: number; title: string }) => void }) {
  const [rows, setRows] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('ALL');
  const [selected, setSelected] = useState<Entry | null>(null);
  const [reason, setReason] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<Entry | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const responses = await Promise.all(['/api/resources', '/api/admin/catalog-links'].map(url => fetch(url, { credentials: 'include', cache: 'no-store' })));
      if (responses.some(r => !r.ok)) throw new Error('Could not load the complete catalog. Check your administrator session and retry.');
      const [pdfs, links] = await Promise.all(responses.map(r => r.json()));
      setRows([
        ...pdfs.map((r: any) => ({ ...r, key: `pdf-${r.id}`, kind: 'PDF' })),
        ...links.map((r: any) => ({ ...r, key: `link-${r.id}`, kind: r.linkType === 'VIDEO' ? 'VIDEO' : 'ARTICLE', status: r.status || 'NEEDS_REVIEW' })),
      ]);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load resources.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    void load(); const refresh = () => { if (!document.hidden) void load(); };
    window.addEventListener('focus', refresh); window.addEventListener('edushare:admin-refresh', refresh);
    return () => { window.removeEventListener('focus', refresh); window.removeEventListener('edushare:admin-refresh', refresh); };
  }, [load]);
  const updateLink = async () => {
    if (!confirm || busy) return;
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/admin/catalog-links/${confirm.id}/visibility`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hidden: !confirm.hidden }) });
      if (!response.ok) throw new Error('Could not change resource visibility. Please retry.');
      setConfirm(null); setSelected(null); await load(); await onChanged();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save changes.'); }
    finally { setBusy(false); }
  };
  const decide = async (status: string) => {
    if (!selected || busy) return;
    if (reason.trim().length < 10) { setError('Enter a review reason of at least 10 characters.'); return; }
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/admin/catalog-links/${selected.id}/decision`, { method: 'POST', credentials: 'include', headers: {'Content-Type':'application/json'}, body: JSON.stringify({status, reason: reason.trim(), expectedStatus: selected.status}) });
      if (!response.ok) throw new Error(response.status === 409 ? 'This link changed. Close and refresh before reviewing.' : 'Could not save the review.');
      setSelected(null); setReason(''); await load(); await onChanged();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save review.'); }
    finally { setBusy(false); }
  };
  const visible = rows.filter(row => (statusFilter === 'ALL' || row.status === statusFilter) && (kind === 'ALL' || row.kind === kind) && [row.title,row.moduleCode,row.uploaderEmail].some(value => String(value || '').toLowerCase().includes(query.toLowerCase().trim())));
  const count = (type: string) => rows.filter(row => row.kind === type).length;
  const safeUrl = (value?: string) => { try { const url = new URL(value || ''); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; } catch { return null; } };
  return <section className="rounded-2xl border border-neutral-200 dark:border-neutral-700 p-5 space-y-4 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white" aria-label="All catalog resources">
    <div className="flex flex-wrap justify-between gap-3">
      <div><h4 className="font-bold">All Resources ({rows.length})</h4><p className="text-xs text-neutral-500 dark:text-neutral-300">{count('PDF')} PDF documents · {count('VIDEO')} video lessons · {count('ARTICLE')} articles and web links</p></div>
      <button type="button" onClick={() => void load()} className="rounded-full border px-4 py-2 text-sm">Refresh catalog</button>
    </div>
    <p className="text-xs text-neutral-500 dark:text-neutral-300">Public Browse shows approved resources only. Review unavailable or uncertain link checks here; rejected and hidden links remain available for inspection.</p>
    <div className="flex flex-wrap gap-3">
      <input aria-label="Search all resources" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search title, module or uploader" className="flex-1 min-w-48 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-3 text-sm" />
      <select aria-label="Review status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-xl border p-3 text-sm bg-white text-neutral-900"><option value="ALL">All statuses</option><option value="NEEDS_REVIEW">Links needing review</option><option value="REJECTED">Rejected</option><option value="APPROVED">Approved</option></select>
      <select aria-label="Resource type" value={kind} onChange={e => setKind(e.target.value)} className="rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-3 text-sm"><option value="ALL">All types</option><option value="PDF">PDF documents</option><option value="VIDEO">Video lessons</option><option value="ARTICLE">Articles & websites</option></select>
    </div>
    {loading && <p role="status">Loading resources…</p>}
    {error && <p role="alert" className="text-red-600 dark:text-red-300">{error} <button type="button" onClick={() => void load()} className="underline">Retry</button></p>}
    <p className="text-xs">Showing {visible.length} of {rows.length} resources</p>
    <div className="max-h-[520px] overflow-y-auto space-y-2">
      {visible.map(row => <div key={row.key} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 dark:border-neutral-700 p-3">
        <div className="min-w-0"><button type="button" onClick={() => { setSelected(row); setReason(''); setError(''); }} className="font-semibold text-left break-words hover:underline">{row.title}</button><p className="text-xs text-neutral-500 dark:text-neutral-300 break-all">{row.kind} · {row.moduleCode || 'External link'} · {row.uploaderEmail} · {row.status}{row.hidden ? ' · HIDDEN' : ''}</p></div>
        <div className="flex gap-2"><button type="button" onClick={() => { setSelected(row); setReason(''); setError(''); }} className="rounded-lg border border-blue-300 px-3 py-2 text-sm text-blue-600 dark:text-blue-300">Inspect</button>
          {row.kind === 'PDF' && <button type="button" onClick={() => onDeletePDF({ id: row.id, title: row.title })} className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600">Delete</button>}
          {row.kind !== 'PDF' && <button type="button" onClick={() => setConfirm(row)} className="rounded-lg border px-3 py-2 text-sm">{row.hidden ? 'Restore' : 'Hide'}</button>}
        </div>
      </div>)}
      {!loading && !error && visible.length === 0 && <p className="p-4 text-sm">No matching resources.</p>}
    </div>
    <AdminResourceInspector resource={selected?.kind === 'PDF' ? { id: selected.id, title: selected.title } : null} onClose={() => setSelected(null)} onChanged={async () => { await load(); await onChanged(); }} />
    <Modal isOpen={!!selected && selected.kind !== 'PDF'} onClose={() => setSelected(null)} title={selected?.title}>
      {selected && <div className="space-y-3"><p>{selected.kind} · {selected.status}</p><p className="break-all text-sm">Shared by {selected.uploaderEmail}</p><p className="break-all text-sm">{selected.url}</p>
        {selected.ownedVideo?<div className="space-y-3"><p>{selected.ownership==='OWNED'?'Creator’s own video':'Authorised video'} · {selected.priceType} {selected.priceType==='Paid'?`· Rs. ${selected.price}`:''}</p><video controls preload="metadata" src={`/api/owned-videos/${selected.id}/stream`} className="w-full rounded-xl bg-black"/><a className="underline" href={`/api/owned-videos/${selected.id}/stream`} target="_blank" rel="noopener noreferrer">Open full video for review</a><VideoPermissionReview id={selected.id}/></div>:safeUrl(selected.url) ? <a href={safeUrl(selected.url)!} target="_blank" rel="noopener noreferrer" className="inline-block rounded-full bg-[#FF4A00] text-white px-5 py-3 font-bold">Open original resource</a> : <p>Original link unavailable.</p>}
        <p className="text-sm">Review the original content before overriding a content decision. Restoring visibility alone does not approve a link.</p>
        <LinkSubjectEditor id={selected.id} moduleCode={selected.moduleCode} onSaved={async()=>{setSelected(null);await load();await onChanged();}}/>
        <p className="text-sm rounded-xl bg-amber-50 text-neutral-900 p-3">{selected.moderationReason || 'Awaiting content review.'}</p>
        <label className="block text-sm">Review reason<input value={reason} maxLength={1000} onChange={e => setReason(e.target.value)} className="block w-full border rounded-lg p-3 bg-white text-neutral-900" placeholder="Explain your decision (10–1000 characters)" /></label>
        {error && <p role="alert" className="text-red-600">{error}</p>}
        <div className="flex flex-wrap gap-2">{['APPROVED','REJECTED','NEEDS_REVIEW'].map(status => <button key={status} type="button" disabled={busy} onClick={() => void decide(status)} className="rounded-full border px-4 py-2 disabled:opacity-50">{status === 'APPROVED' ? 'Approve' : status === 'REJECTED' ? 'Reject' : 'Return to review'}</button>)}</div>
        </div>}
    </Modal>
    <Modal isOpen={confirm !== null} onClose={() => { if (!busy) setConfirm(null); }} title={confirm?.hidden ? 'Restore this resource?' : 'Hide this resource?'}>
      <p className="mb-4">{confirm?.hidden ? 'This removes the visibility restriction. Only an APPROVED link appears in Public Browse.' : 'This link will be removed from Public Browse. You can restore it later.'}</p>
      {error && <p role="alert" className="mb-3 text-red-600 dark:text-red-300">{error}</p>}
      <div className="flex gap-3"><button type="button" disabled={busy} onClick={() => void updateLink()} className="rounded-full px-5 py-2 bg-[#FF4A00] text-white font-bold">{busy ? 'Saving…' : 'Confirm'}</button><button type="button" disabled={busy} onClick={() => setConfirm(null)}>Cancel</button></div>
    </Modal>
  </section>;
}

function VideoPermissionReview({id}:{id:number}){const [rights,setRights]=useState<any>(null),[error,setError]=useState('');useEffect(()=>{let live=true;fetch(`/api/owned-videos/${id}/rights`,{credentials:'include'}).then(r=>{if(!r.ok)throw new Error('Could not load permission details.');return r.json();}).then(d=>{if(live)setRights(d);}).catch(e=>{if(live)setError(e.message);});return()=>{live=false;};},[id]);return <div className="text-sm space-y-2">{error&&<p role="alert">{error}</p>}{rights&&<><p>Creator: {rights.creator}</p><p>{rights.permissionNote||'Uploader declared this as their own video.'}</p></>}<p>Check both the full video and preview before approving. The permission declaration has not been independently verified.</p><video controls preload="none" src={`/api/owned-videos/${id}/preview`} className="w-full rounded-xl bg-black"/></div>;}
