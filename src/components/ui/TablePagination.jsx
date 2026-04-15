import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function TablePagination({ total, page, pageSize, onPage, onPageSize }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pages = [];
  const maxVisible = 5;
  let startPage = Math.max(1, page - 2);
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage < maxVisible - 1) startPage = Math.max(1, endPage - maxVisible + 1);
  for (let i = startPage; i <= endPage; i++) pages.push(i);

  return (
    <div className="table-pagination">
      <span className="table-pagination-info">
        {total === 0 ? "No results" : `${start}–${end} of ${total}`}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <label style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Rows:&nbsp;
          <select
            className="table-rows-select"
            value={pageSize}
            onChange={e => { onPageSize(Number(e.target.value)); onPage(1); }}
          >
            {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <div className="table-pagination-controls">
          <button
            className="table-pagination-btn"
            onClick={() => onPage(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft size={12} />
          </button>
          {startPage > 1 && (
            <>
              <button className="table-pagination-btn" onClick={() => onPage(1)}>1</button>
              {startPage > 2 && (
                <span style={{ padding: "0 4px", fontSize: 12, color: "var(--text-muted)" }}>…</span>
              )}
            </>
          )}
          {pages.map(p => (
            <button
              key={p}
              className={`table-pagination-btn${p === page ? " active" : ""}`}
              onClick={() => onPage(p)}
            >
              {p}
            </button>
          ))}
          {endPage < totalPages && (
            <>
              <span style={{ padding: "0 4px", fontSize: 12, color: "var(--text-muted)" }}>…</span>
              <button className="table-pagination-btn" onClick={() => onPage(totalPages)}>{totalPages}</button>
            </>
          )}
          <button
            className="table-pagination-btn"
            onClick={() => onPage(page + 1)}
            disabled={page >= totalPages}
          >
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
