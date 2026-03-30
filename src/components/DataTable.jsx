import { useState, useMemo } from "react";
import { Search, Inbox } from "lucide-react";
import { usePagination } from "./Pagination";

/**
 * DataTable — standardized table with built-in search + pagination.
 * Fixed height container for consistent layout (25 rows visible area).
 */
export default function DataTable({
  columns = [],
  data = [],
  searchFields,
  searchPlaceholder = "Search...",
  onRowClick,
  emptyMessage = "No data found",
  perPage = 25,
  loading = false,
  actions,
  hideSearch = false,
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim() || !searchFields?.length) return data;
    const q = search.toLowerCase();
    return data.filter(row =>
      searchFields.some(field => {
        const val = row[field];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, searchFields]);

  const { paginated, Pager } = usePagination(filtered, perPage);
  const colCount = columns.length + (actions ? 1 : 0);

  if (loading) {
    return <div className="dt-loading"><span className="spinner" /></div>;
  }

  return (
    <div className="dt-container">
      {!hideSearch && searchFields?.length > 0 && (
        <div className="dt-search">
          <Search size={14} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={searchPlaceholder} />
          {search && <button className="dt-search-clear" onClick={() => setSearch("")}>&times;</button>}
        </div>
      )}

      <div className="dt-table-wrap">
        <table className="dt-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} style={col.headerStyle}>{col.label}</th>
              ))}
              {actions && <th style={{ width: 100, textAlign: "center" }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={colCount}>
                  <div className="dt-empty">
                    <Inbox size={28} strokeWidth={1.5} />
                    <span>{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((row, i) => (
                <tr
                  key={row.id || row.receiptNo || i}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={onRowClick ? "dt-clickable" : ""}
                >
                  {columns.map(col => (
                    <td key={col.key} data-label={col.label} style={col.cellStyle}>
                      {col.render ? col.render(row, i) : (row[col.key] ?? "—")}
                    </td>
                  ))}
                  {actions && <td data-label="Actions" style={{ textAlign: "center" }}>{actions(row, i)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pager />
    </div>
  );
}
