import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

/**
 * Reusable Pagination Component
 *
 * Usage:
 *   const { page, paginated, Pager } = usePagination(data, 25);
 *   return <>{paginated.map(...)}<Pager /></>;
 *
 * Or standalone:
 *   <Pagination page={1} totalPages={10} onPageChange={setPage} totalItems={245} />
 */

export function Pagination({ page, totalPages, onPageChange, totalItems, perPage = 25 }) {
  if (totalPages <= 1) return null;
  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, totalItems);

  return (
    <div className="pagination">
      <span className="pagination-info">
        Showing {start}–{end} of {totalItems}
      </span>
      <div className="pagination-controls">
        <button className="pagination-btn" onClick={() => onPageChange(1)} disabled={page === 1} title="First page">
          <ChevronsLeft size={14} />
        </button>
        <button className="pagination-btn" onClick={() => onPageChange(page - 1)} disabled={page === 1} title="Previous">
          <ChevronLeft size={14} />
        </button>
        {/* Page numbers */}
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce((acc, p, i, arr) => {
            if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === "..." ? (
              <span key={`dots-${i}`} className="pagination-dots">...</span>
            ) : (
              <button key={p} className={`pagination-btn pagination-num${p === page ? " active" : ""}`} onClick={() => onPageChange(p)}>
                {p}
              </button>
            )
          )}
        <button className="pagination-btn" onClick={() => onPageChange(page + 1)} disabled={page === totalPages} title="Next">
          <ChevronRight size={14} />
        </button>
        <button className="pagination-btn" onClick={() => onPageChange(totalPages)} disabled={page === totalPages} title="Last page">
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
}

/**
 * Hook: usePagination
 * Handles page state + slicing for any array.
 *
 * const { page, setPage, paginated, totalPages, Pager } = usePagination(filteredData, 25);
 */
import { useState, useMemo, useCallback, useEffect } from "react";

export function usePagination(data = [], perPage = 25) {
  const [page, setPage] = useState(1);
  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

  // Reset to page 1 when data changes (e.g., search filter)
  useEffect(() => {
    setPage(1);
  }, [totalItems]);

  const paginated = useMemo(() => {
    const start = (page - 1) * perPage;
    return data.slice(start, start + perPage);
  }, [data, page, perPage]);

  const Pager = useMemo(
    () => function PagerComponent() {
      return (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={totalItems}
          perPage={perPage}
        />
      );
    },
    [page, totalPages, totalItems, perPage]
  );

  return { page, setPage, paginated, totalPages, totalItems, Pager };
}
