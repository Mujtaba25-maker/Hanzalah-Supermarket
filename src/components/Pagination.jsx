export default function Pagination({ page, totalPages, setPage }) {
  return (
    <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="font-semibold text-neutral-400">Page {page} of {totalPages}</span>
      <div className="flex gap-2">
        <button className="btn-muted px-3 disabled:opacity-40" disabled={page === 1} onClick={() => setPage(page - 1)} type="button">Previous</button>
        <button className="btn-muted px-3 disabled:opacity-40" disabled={page === totalPages} onClick={() => setPage(page + 1)} type="button">Next</button>
      </div>
    </div>
  );
}
