/**
 * Language Switcher Component
 * Dropdown to switch between 11 languages (English + 10 Indian languages).
 * Persists choice to localStorage via i18next language detector.
 */
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown } from 'lucide-react';
import { LANGUAGES } from '../i18n/index.js';

export default function LanguageSwitcher({ compact = false }) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <div ref={ref} style={styles.wrapper}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={styles.trigger}
        aria-label="Select language"
        title="Change language"
      >
        <Globe size={16} />
        {!compact && <span style={styles.label}>{currentLang.nativeName}</span>}
        <ChevronDown size={12} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
      </button>

      {isOpen && (
        <div style={styles.dropdown}>
          <div style={styles.header}>Select Language / भाषा चुनें</div>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              style={{
                ...styles.option,
                ...(lang.code === currentLang.code ? styles.active : {}),
              }}
            >
              <span style={styles.nativeName}>{lang.nativeName}</span>
              <span style={styles.region}>{lang.region}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    position: 'relative',
  },
  trigger: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    borderRadius: '8px',
    border: '1px solid var(--border, #e2e8f0)',
    background: 'var(--bg-secondary, #f8fafc)',
    color: 'var(--text-primary, #334155)',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
  label: {
    maxWidth: '80px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    right: 0,
    width: '220px',
    maxHeight: '360px',
    overflowY: 'auto',
    background: 'var(--bg-primary, white)',
    border: '1px solid var(--border, #e2e8f0)',
    borderRadius: '10px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    zIndex: 1000,
    padding: '4px',
  },
  header: {
    padding: '8px 12px',
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-secondary, #64748b)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid var(--border, #e2e8f0)',
    marginBottom: '4px',
  },
  option: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    color: 'var(--text-primary, #334155)',
    textAlign: 'left',
    transition: 'background 0.15s',
  },
  active: {
    background: 'var(--primary-light, #eff6ff)',
    fontWeight: 600,
    color: 'var(--primary, #2563eb)',
  },
  nativeName: {
    fontWeight: 500,
  },
  region: {
    fontSize: '11px',
    color: 'var(--text-secondary, #94a3b8)',
  },
};
