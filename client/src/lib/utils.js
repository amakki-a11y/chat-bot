export const priorityColors = {
  low: 'bg-slate-500/20 text-slate-400',
  medium: 'bg-blue-500/20 text-blue-400',
  high: 'bg-amber-500/20 text-amber-400',
  urgent: 'bg-red-500/20 text-red-400',
};

export const statusColors = {
  open: 'bg-amber-500/20 text-amber-400',
  in_progress: 'bg-blue-500/20 text-blue-400',
  waiting: 'bg-slate-500/20 text-slate-400',
  resolved: 'bg-green-500/20 text-green-400',
  closed: 'bg-slate-500/20 text-slate-400',
};

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function truncate(str, len = 60) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '...' : str;
}
