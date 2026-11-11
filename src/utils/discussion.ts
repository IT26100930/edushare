export function discussionId(id?: string): string | null {
  const match = /^(backend-resource|backend-link)-(\d+)$/.exec(id || '');
  if (!match || Number(match[2]) <= 0) return null;
  return `${match[1] === 'backend-link' ? '-' : ''}${match[2]}`;
}
export function parseDiscussionTime(value: string): number | null {
  if (!/^\d{1,3}:\d{2}(?::\d{2})?$/.test(value)) return null;
  const parts = value.split(':').map(Number);
  if (parts.at(-1)! >= 60 || (parts.length === 3 && parts[1] >= 60)) return null;
  return parts.reduce((seconds, part) => seconds * 60 + part, 0);
}
export function formatDiscussionTime(value: number): string {
  const s = Math.max(0, Math.floor(value));
  const hh = Math.floor(s / 3600), mm = Math.floor(s / 60) % 60, ss = s % 60;
  return hh ? `${hh}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}` : `${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
}
export function commentDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString(undefined, {dateStyle:'medium',timeStyle:'short'});
}
