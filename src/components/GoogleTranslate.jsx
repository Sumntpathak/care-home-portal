/**
 * Global Language Selector
 *
 * Beautiful dropdown with 50+ languages organized by continent.
 * Indian languages use hand-crafted i18n. All others use Google Translate.
 */
import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check, Search } from 'lucide-react';
import { LANGUAGES, CONTINENT_LABELS } from '../i18n/index.js';

export default function GoogleTranslate() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [currentCode, setCurrentCode] = useState(() => {
    const match = document.cookie.match(/googtrans=\/en\/([^;]+)/);
    return match ? match[1] : (localStorage.getItem('sc_language') || 'en');
  });
  const ref = useRef(null);
  const searchRef = useRef(null);

  const currentLang = LANGUAGES.find(l => l.code === currentCode) || LANGUAGES[0];

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) { setIsOpen(false); setSearch(''); }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search on open
  useEffect(() => {
    if (isOpen && searchRef.current) searchRef.current.focus();
  }, [isOpen]);

  // Group languages by continent, filtered by search
  const grouped = useMemo(() => {
    const q = search.toLowerCase().trim();
    const filtered = q
      ? LANGUAGES.filter(l =>
          l.name.toLowerCase().includes(q) ||
          l.nativeName.toLowerCase().includes(q) ||
          l.code.toLowerCase().includes(q))
      : LANGUAGES;

    const groups = {};
    for (const lang of filtered) {
      const c = lang.continent || 'default';
      if (!groups[c]) groups[c] = [];
      groups[c].push(lang);
    }
    return groups;
  }, [search]);

  const handleSelect = (code) => {
    setIsOpen(false);
    setSearch('');
    localStorage.setItem('sc_language', code);

    const lang = LANGUAGES.find(l => l.code === code);
    const currentHasGoogleTranslate = !!document.cookie.match(/googtrans=\/en\//);

    // Three paths, none of which stack Google-Translate DOM mutations:
    //
    // 1. English: clear the googtrans cookie + reload → fresh untranslated page.
    // 2. Hand-crafted i18n language (hi/ta/te/kn/mr/gu/bn/or/pa/ml): use
    //    react-i18next; don't touch Google Translate; no reload needed.
    //    But if Google Translate was already active, we MUST clear its cookie
    //    and reload once, otherwise its DOM mutations collide with i18n.
    // 3. Google-Translate-only language: set cookie + reload so the widget
    //    re-initializes cleanly. This also handles the "switch from one GT
    //    language to another" case without stacking mutations.

    if (code === 'en') {
      document.cookie = 'googtrans=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'googtrans=;path=/;domain=' + location.hostname + ';expires=Thu, 01 Jan 1970 00:00:00 GMT';
      i18n.changeLanguage('en');
      if (currentHasGoogleTranslate) {
        location.reload();
      } else {
        setCurrentCode('en');
      }
      return;
    }

    if (lang?.hasI18n) {
      // If Google Translate was active, we need a reload to unwind its DOM
      // changes before react-i18next takes over.
      if (currentHasGoogleTranslate) {
        document.cookie = 'googtrans=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'googtrans=;path=/;domain=' + location.hostname + ';expires=Thu, 01 Jan 1970 00:00:00 GMT';
        i18n.changeLanguage(code);
        location.reload();
      } else {
        i18n.changeLanguage(code);
        setCurrentCode(code);
      }
      return;
    }

    // Non-i18n language → always reload with cookie. Reliable, no mutation stack.
    i18n.changeLanguage('en'); // fallback so partial strings stay sane
    document.cookie = 'googtrans=/en/' + code + ';path=/';
    document.cookie = 'googtrans=/en/' + code + ';path=/;domain=' + location.hostname;
    location.reload();
  };

  const continentOrder = ['default', 'asia_india', 'europe', 'middle_east', 'asia_east', 'africa', 'americas', 'oceania'];

  return (
    <div ref={ref} className="notranslate" style={styles.wrapper}>
      <button onClick={() => setIsOpen(!isOpen)} style={styles.trigger}>
        <Globe size={15} style={{ color: 'var(--primary, #4f8cdb)', flexShrink: 0 }} />
        <span style={styles.langLabel}>{currentLang.nativeName}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" style={{ opacity: 0.4, transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.2s', flexShrink: 0 }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div style={styles.dropdown}>
          {/* Search */}
          <div style={styles.searchBox}>
            <Search size={14} style={{ color: 'var(--text-tertiary, #94a3b8)', flexShrink: 0 }} />
            <input
              ref={searchRef}
              style={styles.searchInput}
              placeholder="Search language..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Language list grouped by continent */}
          <div style={styles.list}>
            {continentOrder.map(continent => {
              const langs = grouped[continent];
              if (!langs || langs.length === 0) return null;
              return (
                <div key={continent}>
                  <div style={styles.section}>{CONTINENT_LABELS[continent]}</div>
                  {langs.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => handleSelect(lang.code)}
                      style={{
                        ...styles.option,
                        ...(lang.code === currentCode ? styles.optionActive : {}),
                      }}
                      onMouseEnter={(e) => { if (lang.code !== currentCode) e.currentTarget.style.background = 'var(--bg-hover, #f8fafc)'; }}
                      onMouseLeave={(e) => { if (lang.code !== currentCode) e.currentTarget.style.background = 'none'; }}
                    >
                      <div style={styles.optionLeft}>
                        <span style={styles.native}>{lang.nativeName}</span>
                        {lang.nativeName !== lang.name && <span style={styles.eng}>{lang.name}</span>}
                      </div>
                      <div style={styles.optionRight}>
                        {lang.hasI18n && <span style={styles.badge}>i18n</span>}
                        {lang.code === currentCode && <Check size={14} style={{ color: 'var(--primary, #4f8cdb)' }} />}
                      </div>
                    </button>
                  ))}
                </div>
              );
            })}

            {Object.keys(grouped).length === 0 && (
              <div style={styles.noResult}>No language found</div>
            )}
          </div>

          <div style={styles.footer}>
            <span style={{ fontSize: '10px', color: 'var(--text-tertiary, #94a3b8)' }}>
              {LANGUAGES.length} languages • <span style={{ color: 'var(--primary, #4f8cdb)' }}>i18n</span> = curated medical terms
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    position: 'relative',
    zIndex: 100,
  },
  trigger: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    padding: '6px 12px',
    borderRadius: '10px',
    border: '1px solid var(--border, #e2e8f0)',
    background: 'var(--bg-secondary, #f8fafc)',
    color: 'var(--text-primary, #334155)',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  },
  langLabel: {
    maxWidth: '100px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: '300px',
    background: 'var(--bg-primary, white)',
    border: '1px solid var(--border, #e2e8f0)',
    borderRadius: '14px',
    boxShadow: '0 16px 48px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.04)',
    zIndex: 99999,
    overflow: 'hidden',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    borderBottom: '1px solid var(--border, #f1f5f9)',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '13px',
    fontFamily: 'inherit',
    background: 'transparent',
    color: 'var(--text-primary, #334155)',
  },
  list: {
    maxHeight: '380px',
    overflowY: 'auto',
    padding: '4px 6px',
  },
  section: {
    padding: '8px 10px 4px',
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--text-secondary, #64748b)',
    letterSpacing: '0.3px',
    marginTop: '2px',
  },
  option: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '8px 10px',
    borderRadius: '8px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    color: 'var(--text-primary, #334155)',
    textAlign: 'left',
    fontFamily: 'inherit',
    transition: 'background 0.1s',
  },
  optionActive: {
    background: 'var(--primary-light, #eff6ff)',
    color: 'var(--primary, #2563eb)',
  },
  optionLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    pointerEvents: 'none',
  },
  optionRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    pointerEvents: 'none',
  },
  native: {
    fontWeight: 600,
    fontSize: '13px',
  },
  eng: {
    fontSize: '11px',
    color: 'var(--text-secondary, #94a3b8)',
    fontWeight: 400,
  },
  badge: {
    fontSize: '9px',
    fontWeight: 700,
    color: 'var(--primary, #4f8cdb)',
    background: 'var(--primary-light, #eff6ff)',
    padding: '1px 5px',
    borderRadius: '4px',
    letterSpacing: '0.3px',
  },
  noResult: {
    padding: '20px',
    textAlign: 'center',
    color: 'var(--text-tertiary, #94a3b8)',
    fontSize: '13px',
  },
  footer: {
    padding: '8px 14px',
    borderTop: '1px solid var(--border, #f1f5f9)',
    textAlign: 'center',
  },
};
