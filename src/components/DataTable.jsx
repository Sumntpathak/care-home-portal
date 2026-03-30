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
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

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

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [filtered, sortKey, sortDir]);

  const { paginated, Pager } = usePagination(sorted, perPage);
  const colCount = columns.length + (actions ? 1 : 0);

  if (loading) {
    return (
      <div style={{ padding: "8px 0" }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{ display: "flex", gap: "12px", padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--subtle)", animation: "pulse 1.5s ease-in-out infinite" }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ height: "12px", width: `${60 + i * 7}%`, borderRadius: "4px", background: "var(--subtle)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 0.1}s` }} />
              <div style={{ height: "10px", width: `${40 + i * 5}%`, borderRadius: "4px", background: "var(--subtle)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 0.15}s` }} />
            </div>
            <div style={{ width: "60px", height: "24px", borderRadius: "4px", background: "var(--subtle)", animation: "pulse 1.5s ease-in-out infinite" }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="dt-container">
      {!hideSearch && searchFields?.length > 0 && (
        <div className="dt-search">
          <Search size={14} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={searchPlaceholder} aria-label="Search table" />
          {search && <button className="dt-search-clear" onClick={() => setSearch("")}>&times;</button>}
        </div>
      )}

      <div className="dt-table-wrap">
        <table className="dt-table" aria-label="Data table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} onClick={() => handleSort(col.key)} style={{ ...col.headerStyle, cursor: "pointer", userSelect: "none" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    {col.label}
                    {sortKey === col.key && (
                      <span style={{ fontSize: "10px", opacity: 0.6 }}>{sortDir === "asc" ? "\u25B2" : "\u25BC"}</span>
                    )}
                  </span>
                </th>
              ))}
              {actions && <th style={{ width: 100, textAlign: "center" }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
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
