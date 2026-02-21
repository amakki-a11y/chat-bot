import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="p-1.5 rounded bg-[#334155] text-slate-300 hover:bg-[#475569] disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="text-sm text-slate-400">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="p-1.5 rounded bg-[#334155] text-slate-300 hover:bg-[#475569] disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
