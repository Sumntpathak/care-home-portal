import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * Modal — unified dialog primitive for Shanti Care.
 *
 * Props:
 *   open              boolean   show/hide
 *   onClose           fn        called on ESC, backdrop click, or close button
 *   title             node      header title (optional)
 *   subtitle          node      small line under title (optional)
 *   headerActions     node      buttons/content on the right of the header
 *   footer            node      sticky footer (optional)
 *   size              sm|md|lg|xl|full         preset width; default md
 *   maxWidth          number                   overrides size; px
 *   variant           default | print          "print" forces opaque surfaces for printable dialogs
 *   noPadding         boolean                  body has no padding
 *   closeOnBackdrop   boolean = true           clicking backdrop closes
 *   closeOnEsc        boolean = true           ESC closes
 *   showClose         boolean = true           show the X button in header
 *   labelledBy        string                   a11y id override
 *   className         string                   extra class on the sheet
 *   bodyClassName     string                   extra class on the body
 *
 * All alignment/scroll-lock/focus-trap is handled here. Pages should NEVER
 * hand-roll a backdrop div again.
 */
export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  headerActions,
  footer,
  children,
  size = "md",
  maxWidth,
  variant = "default",
  noPadding = false,
  closeOnBackdrop = true,
  closeOnEsc = true,
  showClose = true,
  labelledBy,
  className = "",
  bodyClassName = "",
}) {
  const sheetRef = useRef(null);
  const prevFocusRef = useRef(null);
  const titleId = useRef(`sc-modal-${Math.random().toString(36).slice(2, 9)}`).current;

  const handleBackdrop = useCallback((e) => {
    if (!closeOnBackdrop) return;
    if (e.target === e.currentTarget) onClose?.();
  }, [closeOnBackdrop, onClose]);

  // ESC handler + focus trap + body scroll lock
  useEffect(() => {
    if (!open) return;

    prevFocusRef.current = document.activeElement;

    const onKey = (e) => {
      if (e.key === "Escape" && closeOnEsc) {
        e.stopPropagation();
        onClose?.();
        return;
      }
      if (e.key === "Tab" && sheetRef.current) {
        const focusables = sheetRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey, true);

    // Belt-and-suspenders scroll lock — CSS :has() handles this too, but not every browser
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Autofocus first focusable inside the sheet
    const raf = requestAnimationFrame(() => {
      if (!sheetRef.current) return;
      const focusables = sheetRef.current.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const target = [...focusables].find(el => !el.classList.contains("sc-modal__close")) || focusables[0];
      target?.focus?.();
    });

    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = prevOverflow;
      cancelAnimationFrame(raf);
      // Restore focus to whoever opened the modal
      if (prevFocusRef.current && typeof prevFocusRef.current.focus === "function") {
        prevFocusRef.current.focus();
      }
    };
  }, [open, closeOnEsc, onClose]);

  if (!open) return null;

  const sizeClass =
    size === "sm" ? "sc-modal__sheet--sm" :
    size === "lg" ? "sc-modal__sheet--lg" :
    size === "xl" ? "sc-modal__sheet--xl" :
    size === "full" ? "sc-modal__sheet--full" :
    "sc-modal__sheet--md";

  const variantClass = variant === "print" ? "sc-modal__sheet--print" : "";

  return createPortal(
    <div
      className={`sc-modal ${variant === "print" ? "sc-modal--print" : ""}`}
      onMouseDown={handleBackdrop}
      role="presentation"
    >
      <div
        ref={sheetRef}
        className={`sc-modal__sheet ${sizeClass} ${variantClass} ${className}`.trim()}
        style={maxWidth ? { maxWidth: `min(95vw, ${maxWidth}px)` } : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy || (title ? titleId : undefined)}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {(title || showClose || headerActions) && (
          <header className="sc-modal__header">
            <div className="sc-modal__header-text">
              {title && (
                <h3 id={titleId} className="sc-modal__title">{title}</h3>
              )}
              {subtitle && <p className="sc-modal__subtitle">{subtitle}</p>}
            </div>
            <div className="sc-modal__header-actions">
              {headerActions}
              {showClose && onClose && (
                <button
                  type="button"
                  className="sc-modal__close"
                  onClick={onClose}
                  aria-label="Close dialog"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </header>
        )}

        <div className={`sc-modal__body ${noPadding ? "sc-modal__body--flush" : ""} ${bodyClassName}`.trim()}>
          {children}
        </div>

        {footer && (
          <footer className="sc-modal__footer">{footer}</footer>
        )}
      </div>
    </div>,
    document.body
  );
}
