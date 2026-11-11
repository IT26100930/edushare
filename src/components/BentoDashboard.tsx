import React, { useEffect, useState } from 'react';
import { BookOpen, Users, FileText } from 'lucide-react';

interface PublicStats {
  members: number;
  modules: number;
  resources: number;
  downloadsByDay: Record<string, number>;
}

/** All values are loaded from the Java file-backed API. */
export const BentoDashboard: React.FC = () => {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loadError, setLoadError] = useState(false);
  useEffect(() => {
    fetch('/api/public/stats', { credentials: 'include', cache: 'no-store' })
      .then(response => {
        if (!response.ok) throw new Error('Stats unavailable');
        return response.json();
      })
      .then((data: PublicStats) => { setStats(data); setLoadError(false); })
      .catch(() => setLoadError(true));
  }, []);

  const cards = [
    {label: 'Study Modules', count: stats?.modules, icon: BookOpen},
    {label: 'Shared Resources', count: stats?.resources, icon: FileText},
    {label: 'Registered Members', count: stats?.members, icon: Users},
  ];
  const downloads = Object.entries(stats?.downloadsByDay || {});
  const highest = Math.max(1, ...downloads.map(([, amount]) => amount));

  return (
    <div className="w-full rounded-[18px] p-5 border border-neutral-200 dark:border-neutral-700 bg-white/90 dark:bg-[#1C1F28]/95 shadow-sm">
      <div className="grid grid-cols-3 gap-3 mb-5">
        {cards.map(({label, count, icon: Icon}) => (
          <div key={label} className="rounded-xl bg-neutral-50 dark:bg-neutral-800 p-3">
            <div className="flex justify-between items-center gap-2 text-neutral-500 dark:text-neutral-300 text-xs">
              <span>{label}</span><Icon className="w-4 h-4" />
            </div>
            <div className="font-bold text-xl text-neutral-900 dark:text-white mt-2">{count ?? '—'}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-neutral-50/80 dark:bg-neutral-800/60 p-4">
        <p className="font-semibold text-xs text-neutral-800 dark:text-neutral-100">PDF Downloads — Last 7 Days</p>
        {loadError ? <p className="text-xs text-amber-600 mt-4">Could not load activity. Refresh this page.</p> : (
          <div className="flex gap-2 items-end h-28 mt-3" aria-label="Daily download counts">
            {downloads.map(([day, amount]) => (
              <div key={day} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                <span className="text-[10px] text-neutral-600 dark:text-neutral-300">{amount}</span>
                <div className="bg-[#1E6FEB] w-full max-w-9 rounded-t-lg" style={{height: `${Math.max(4, (amount / highest) * 75)}%`}} />
                <span className="text-[9px] text-neutral-500 dark:text-neutral-300">{day.slice(5)}</span>
              </div>
            ))}
            {!downloads.length && <p className="text-xs text-neutral-500">Loading activity…</p>}
          </div>
        )}
      </div>
    </div>
  );
};
