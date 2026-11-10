import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, XCircle, EyeOff, CircleHelp, RefreshCw } from 'lucide-react';
type Review = { id: number; title: string; status: string; moderationReason: string; hidden?: boolean };
function presentation(row: Review) {
  const status = row.hidden ? 'HIDDEN' : String(row.status || '').toUpperCase();
  if (status === 'APPROVED') return { tone:'approved', label:'Approved · published', Icon:CheckCircle2 };
  if (status === 'PENDING' || status === 'NEEDS_REVIEW' || status === 'NEEDS_EVIDENCE') return { tone:'pending', label:'Pending review · not public yet', Icon:Clock };
  if (status === 'REJECTED') return { tone:'rejected', label:'Rejected · not published', Icon:XCircle };
  if (status === 'HIDDEN') return { tone:'hidden', label:'Hidden · not public', Icon:EyeOff };
  return { tone:'hidden', label:'Status unavailable', Icon:CircleHelp };
}
export function MyLinkReviews({ refreshKey }: { refreshKey: boolean }) {
  const [rows, setRows] = useState<Review[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const response = await fetch('/api/links/mine', { credentials: 'include', cache: 'no-store', signal });
      if (!response.ok) throw new Error('Could not load your link reviews.');
      const result = await response.json();
      if (!signal?.aborted) { setRows(result); setError(''); }
    } catch (e) { if (!signal?.aborted) setError(e instanceof Error ? e.message : 'Could not load reviews.'); }
    finally { if (!signal?.aborted) setLoading(false); }
  };
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [refreshKey]);
  return <section className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5 space-y-4 text-neutral-900 dark:text-neutral-100" aria-label="My shared links">
    <div className="flex flex-wrap justify-between items-center gap-3"><h2 className="font-bold">My shared links</h2><button type="button" disabled={loading} onClick={() => void load()} className="flex items-center gap-2 rounded-full border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm font-semibold disabled:opacity-60"><RefreshCw size={15}/>{loading ? 'Checking…' : 'Refresh status'}</button></div>
    <p className="text-sm text-neutral-600 dark:text-neutral-300">Green cards are approved and published. Amber cards are waiting for review. Rejected links stay private; ask an administrator if you disagree with a decision.</p>
    {loading && <p role="status" className="text-sm">Loading your link statuses…</p>}
    {error && <p role="alert" className="text-red-700 dark:text-red-300">{error}</p>}
    <div className="max-h-80 overflow-y-auto space-y-3" aria-busy={loading}>{rows.map(row => {
      const {tone,label,Icon}=presentation(row);
      return <article key={row.id} className={`shared-link-status shared-link-${tone} border rounded-2xl p-4`} aria-label={`${row.title}: ${label}`}>
        <p className="font-bold break-words">{row.title}</p>
        <p className="shared-link-status-label flex items-center gap-2 text-sm font-bold mt-2"><Icon size={18} className="shrink-0" aria-hidden="true"/>{label}</p>
        {row.moderationReason && <p className="text-sm text-neutral-700 dark:text-neutral-200 mt-2 break-words">{row.moderationReason}</p>}
      </article>;
    })}
    {!loading && !rows.length && !error && <p className="text-sm text-neutral-600 dark:text-neutral-300">You have no shared links yet.</p>}</div>
  </section>;
}
