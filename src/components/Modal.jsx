import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Modal — standardized overlay/backdrop replacing 18 inline implementations.
 *
 * Usage:
 *   <Modal onClose={close} title="Edit Patient" maxWidth={600}>
 *     <form>...</form>
 *   </Modal>
 */
export default function Modal({ children, onClose, title, maxWidth = 600, noPadding = false }) {
  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // ESC to close
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div className="modal-content" style={{ maxWidth }}>
        {title && (
          <div className="modal-header">
            <h3 className="modal-title" id="modal-title">{title}</h3>
            <button className="modal-close" onClick={onClose} aria-label="Close dialog"><X size={16} /></button>
          </div>
        )}
        <div className={noPadding ? "" : "modal-body"}>
          {children}
        </div>
      </div>
    </div>
  );
}
