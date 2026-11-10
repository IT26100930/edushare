import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Download, Users, UserPlus, TrendingUp, ArrowUpRight } from 'lucide-react';
import { Modal } from './shared/Modal.tsx';
import type { Resource } from '../data/models.ts';

type Person = { id: number; name: string; username: string; avatar: string; verified: boolean; following: boolean };
type Connections = { followers: Person[]; following: Person[] };
type Panel = 'uploads' | 'downloads' | 'followers' | 'following' | 'reputation';
type Props = {
  profileId: string; viewerId?: string; uploads: Resource[];
  followingSignal: boolean; onConnectionChange: () => void;
};
const numericId = (id?: string) => id?.startsWith('backend-user-') ? Number(id.slice(13)) : NaN;

export function ProfileStatsPanel({ profileId, viewerId, uploads, followingSignal, onConnectionChange }: Props) {
  const [panel, setPanel] = useState<Panel | null>(null);
  const [connections, setConnections] = useState<Connections | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState<number | null>(null);
  const requestNumber = useRef(0);
  const profile = numericId(profileId);
  const viewer = numericId(viewerId);
  const load = useCallback(async (signal?: AbortSignal) => {
    const request = ++requestNumber.current;
    if (!Number.isSafeInteger(profile) || profile <= 0) {
      setConnections(null); setLoading(false); setError('This profile is unavailable.'); return;
    }
    setLoading(true); setError('');
    try {
      const response = await fetch(`/api/profile-connections/${profile}`, { credentials: 'include', cache: 'no-store', signal });
      if (!response.ok) throw new Error(response.status === 401 ? 'Please sign in again.' : 'Could not load connections. Please retry.');
      const result: Connections = await response.json();
      if (request === requestNumber.current) setConnections(result);
    } catch (e) {
      if (!signal?.aborted && request === requestNumber.current) setError(e instanceof Error ? e.message : 'Could not load connections.');
    } finally { if (request === requestNumber.current) setLoading(false); }
  }, [profile, viewerId]);

  useEffect(() => {
    const controller = new AbortController();
    setConnections(null); setPanel(null); setSearch('');
    void load(controller.signal);
    return () => { controller.abort(); requestNumber.current++; };
  }, [load, followingSignal]);
  useEffect(() => {
    const refresh = () => { void load(); };
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [load]);

  const open = (value: Panel) => {
    setPanel(value); setSearch(''); setError('');
    if (value === 'followers' || value === 'following') void load();
  };
  const toggle = async (person: Person) => {
    if (busy !== null || person.id === viewer) return;
    setBusy(person.id); setError('');
    try {
      const response = await fetch(`/api/follows/${person.id}`, {
        method: person.following ? 'DELETE' : 'POST', credentials: 'include',
      });
      if (!response.ok) throw new Error(response.status === 401 ? 'Please sign in again.' : 'Could not update following. Please retry.');
      await load(); onConnectionChange();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not update following.'); }
    finally { setBusy(null); }
  };
  const reviews = uploads.flatMap(resource => resource.reviews
    .filter(review => Number.isFinite(review.rating) && review.rating >= 1 && review.rating <= 5)
    .map(review => ({ ...review, resourceId: resource.id, resourceTitle: resource.title })));
  const downloads = uploads.reduce((sum, resource) => sum + Math.max(0, Number(resource.downloads) || 0), 0);
  const reputation = reviews.length ? `${Math.round(reviews.filter(r => r.rating >= 4).length / reviews.length * 100)}%` : '—';
  const items: { id: Panel; title: string; value: string | number; hint: string; icon: React.ReactNode }[] = [
    { id: 'uploads', title: 'Uploads', value: uploads.length, hint: 'View shared resources', icon: <BookOpen size={17} /> },
    { id: 'downloads', title: 'Downloads', value: downloads, hint: 'View downloads by resource', icon: <Download size={17} /> },
    { id: 'followers', title: 'Followers', value: connections?.followers.length ?? '—', hint: 'People following this account', icon: <Users size={17} /> },
    { id: 'following', title: 'Following', value: connections?.following.length ?? '—', hint: 'Accounts followed', icon: <UserPlus size={17} /> },
    { id: 'reputation', title: 'Reputation', value: reputation, hint: reviews.length ? `${reviews.length} peer ratings` : 'No peer ratings yet', icon: <TrendingUp size={17} /> },
  ];
  const people = panel === 'followers' ? connections?.followers : connections?.following;
  const filtered = (people || []).filter(person => `${person.name} ${person.username}`.toLowerCase().includes(search.toLowerCase().trim()));
  return <>
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
      {items.map(item => <button type="button" key={item.id} onClick={() => open(item.id)}
        aria-label={`View ${item.title.toLowerCase()}`} aria-haspopup="dialog" aria-expanded={panel === item.id}
        className={`profile-stat profile-stat-${item.id} text-left rounded-2xl border p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#657fb6]`}>
        <span className="flex justify-between items-center text-xs uppercase font-bold tracking-wide profile-stat-heading">{item.title}<span className="profile-stat-icon rounded-xl p-2">{item.icon}</span></span>
        <span className="block mt-3 text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">{item.value}</span>
        <span className="block mt-2 text-xs text-neutral-600 dark:text-neutral-300">{item.hint}</span>
        <span className="profile-stat-action flex items-center justify-between gap-2 mt-4 pt-3 border-t text-xs font-bold">Open details <ArrowUpRight size={17} aria-hidden="true"/></span>
      </button>)}
    </div>
    <Modal isOpen={panel !== null} onClose={() => setPanel(null)} title={items.find(item => item.id === panel)?.title} maxWidth="lg">
      <div className="text-neutral-900 dark:text-neutral-100 space-y-4">
        {(panel === 'followers' || panel === 'following') ? <>
          <div className="flex gap-2">
            {(['followers', 'following'] as const).map(tab => <button type="button" key={tab} onClick={() => open(tab)} className={`rounded-full px-4 py-2 text-sm font-bold ${panel === tab ? 'bg-[#FF4A00] text-white' : 'bg-neutral-100 dark:bg-neutral-800'}`}>
              {tab === 'followers' ? 'Followers' : 'Following'} ({connections?.[tab].length ?? '—'})
            </button>)}
          </div>
          <input aria-label="Search accounts" placeholder="Search name or username" value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-3" />
          {loading && <p role="status" className="text-sm">Loading connections…</p>}
          {error && <div role="alert" className="text-sm text-red-600 dark:text-red-300">{error} <button type="button" onClick={() => void load()} className="underline">Retry</button></div>}
          {!loading && !error && filtered.length === 0 && <p className="text-sm text-neutral-500 dark:text-neutral-300">{search ? 'No matching accounts.' : panel === 'followers' ? 'No followers yet.' : 'No accounts followed yet.'}</p>}
          <div className="max-h-[45vh] overflow-y-auto space-y-2">
            {filtered.map(person => <div key={person.id} className="flex items-center gap-3 py-2">
              <Link to={`/u/${encodeURIComponent(person.username)}`} onClick={() => setPanel(null)} className="flex items-center gap-3 min-w-0 flex-1 rounded-lg focus-visible:ring-2 focus-visible:ring-[#FF4A00]">
                <span className="w-11 h-11 shrink-0 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold">
                  {person.avatar ? <img src={person.avatar} alt="" className="w-full h-full object-cover" /> : (person.name || '?').charAt(0)}
                </span>
                <span className="min-w-0"><span className="block font-bold truncate">{person.name}{person.verified && <span className="text-blue-600 ml-1" aria-label="Verified">✓</span>}</span><span className="block text-xs text-neutral-500 dark:text-neutral-300 truncate">@{person.username}</span></span>
              </Link>
              {person.id === viewer ? <span className="text-xs text-neutral-500">You</span> : <button type="button" disabled={busy !== null} onClick={() => void toggle(person)} className={`rounded-full px-4 py-2 text-sm font-bold disabled:opacity-50 ${person.following ? 'border border-neutral-300 dark:border-neutral-700' : 'bg-[#FF4A00] text-white'}`}>
                {busy === person.id ? 'Saving…' : person.following ? 'Unfollow' : 'Follow'}
              </button>}
            </div>)}
          </div>
        </> : panel === 'uploads' || panel === 'downloads' ? <>
          <p className="text-sm text-neutral-500 dark:text-neutral-300">{panel === 'uploads' ? 'Resources shared by this account.' : 'Downloads received on this account’s resources. These counts do not identify individual downloaders.'}</p>
          {uploads.length === 0 && <div className="space-y-3"><p>No shared resources yet.</p>
            {panel === 'uploads' && profileId === viewerId && <Link to="/share" onClick={() => setPanel(null)} className="inline-flex rounded-full bg-[#263577] text-white px-4 py-2 font-bold text-sm">Share your first resource →</Link>}
          </div>}
          <div className="max-h-[55vh] overflow-y-auto space-y-2">{uploads.map(resource => <Link key={resource.id} to={`/resource/${resource.id}`} onClick={() => setPanel(null)} className="flex justify-between gap-4 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-[#FF4A00]">
            <span className="font-semibold">{resource.title}</span>{panel === 'downloads' && <span className="shrink-0 text-sm">{Math.max(0, Number(resource.downloads) || 0)} downloads</span>}
          </Link>)}</div>
        </> : panel === 'reputation' ? <>
          <p className="text-sm">{reviews.length ? `${reputation} positive feedback from ${reviews.length} ratings. Ratings of 4 or 5 count as positive.` : 'No peer ratings yet. Reputation appears after shared resources receive reviews.'}</p>
          <div className="max-h-[55vh] overflow-y-auto space-y-2">{reviews.map((review, index) => <Link key={`${review.resourceId}-${index}`} to={`/resource/${review.resourceId}`} onClick={() => setPanel(null)} className="block rounded-xl border border-neutral-200 dark:border-neutral-700 p-3 hover:border-[#FF4A00]">
            <span className="block font-bold">{review.resourceTitle}</span><span className="text-sm">{review.userName} · {review.rating}/5</span>
          </Link>)}</div>
        </> : null}
      </div>
    </Modal>
  </>;
}
