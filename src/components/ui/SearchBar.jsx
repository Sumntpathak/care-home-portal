/**
 * SearchBar — canonical search input for ALL pages.
 * Usage: <SearchBar value={q} onChange={setQ} placeholder="Search patients…" />
 */
import { Search, X } from "lucide-react";

export default function SearchBar({ value, onChange, placeholder = "Search…", style = {} }) {
  return (
    <div className="search-box" style={style}>
      <Search size={14} />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button onClick={() => onChange("")} aria-label="Clear search">
          <X size={13} />
        </button>
      )}
    </div>
  );
}
