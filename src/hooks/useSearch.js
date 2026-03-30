import { useState, useMemo } from "react";

/**
 * useSearch — eliminates the duplicated search/filter pattern across 8+ pages
 *
 * Usage:
 *   const [search, setSearch, filtered] = useSearch(patients, ["name", "id", "phone", "room"]);
 *   <input value={search} onChange={e => setSearch(e.target.value)} />
 *   {filtered.map(p => ...)}
 */
export function useSearch(items = [], searchableFields = []) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(item =>
      searchableFields.some(field => {
        const val = item[field];
        if (val == null) return false;
        return String(val).toLowerCase().includes(q);
      })
    );
  }, [items, search, searchableFields]);

  return [search, setSearch, filtered];
}
