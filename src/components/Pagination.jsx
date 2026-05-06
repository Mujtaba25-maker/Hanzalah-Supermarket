export default function Pagination({ page, totalPages, setPage }) {
  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm">
      <span className="font-semibold text-slate-500">Page {page} of {totalPages}</span>
      <div className="flex gap-2">
        <button className="rounded-lg border border-slate-200 px-3 py-2 font-bold text-slate-700 disabled:opacity-40" disabled={page === 1} onClick={() => setPage(page - 1)} type="button">Previous</button>
        <button className="rounded-lg border border-slate-200 px-3 py-2 font-bold text-slate-700 disabled:opacity-40" disabled={page === totalPages} onClick={() => setPage(page + 1)} type="button">Next</button>
      </div>
    </div>
  );
}
