import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {ArrowRight, Flag} from 'lucide-react';

interface Props {
  counts: {openRequests: number; pendingResources: number; pendingReports: number; pendingModuleRequests?: number} | null;
  onResources: () => void;
  onReports: () => void;
  onModules?: () => void;
}

export function PendingTasksCard({counts, onResources, onReports, onModules}: Props) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const actions = [
    {label: 'Open requests', count: counts?.openRequests ?? 0, open: () => navigate('/requests?status=OPEN')},
    {label: 'Resources awaiting review', count: counts?.pendingResources ?? 0, open: onResources},
    {label: 'Open reports', count: counts?.pendingReports ?? 0, open: onReports},
  ];
  if(onModules) actions.push({label:'Module requests',count:counts?.pendingModuleRequests??0,open:onModules});
  const total = actions.reduce((sum, action) => sum + action.count, 0);
  const openTasks = () => {
    const active = actions.filter(action => action.count > 0);
    if (active.length === 1) active[0].open();
    else setExpanded(value => !value);
  };
  return <section aria-label="Pending tasks" className="rounded-[20px] border border-[#FF4A00]/20 bg-[#FFF0E8] dark:bg-[#2B201C] overflow-hidden">
    <button type="button" disabled={!counts} onClick={openTasks} aria-expanded={expanded} aria-controls="pending-task-categories" className="w-full p-5 text-left space-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6879B7] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] disabled:cursor-wait transition-colors">
      <span className="flex items-center justify-between text-neutral-700 dark:text-neutral-300"><span className="text-xs uppercase font-bold tracking-wider">Pending Tasks</span><Flag className="w-4 h-4 text-[#FF4A00]" /></span>
      <span className="block text-3xl font-extrabold font-display text-[#FF4A00] tabular-nums">{counts ? total : '—'}</span>
      <span className="block text-[11px] text-neutral-600 dark:text-neutral-400">{!counts ? 'Loading tasks…' : total === 0 ? "You're all caught up" : 'View requests, resource reviews, reports and module requests'}</span>
      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#A83C12] dark:text-orange-300 pt-2">{expanded ? 'Hide categories' : total === 0 ? 'View categories' : 'Open tasks'}<ArrowRight className="w-3 h-3" /></span>
    </button>
    {expanded && <div id="pending-task-categories" className="px-4 pb-4 space-y-2">
      {actions.map(action => <button type="button" key={action.label} onClick={action.open} className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-black/20 px-3 py-3 text-left flex items-center justify-between gap-3 text-xs font-semibold text-neutral-800 dark:text-neutral-100 hover:bg-white dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6879B7]"><span>{action.label}</span><span className="inline-flex items-center gap-2"><span className="tabular-nums">{action.count}</span><ArrowRight className="w-3 h-3" /></span></button>)}
    </div>}
  </section>;
}
