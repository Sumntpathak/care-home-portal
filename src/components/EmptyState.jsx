import { Inbox } from "lucide-react";

/**
 * EmptyState — shows when a list/table has no data.
 *
 * Props:
 * - icon: Lucide icon component (default: Inbox)
 * - title: string (e.g. "No patients found")
 * - description: string (e.g. "Try adjusting your search or add a new patient")
 * - action: { label, onClick } (optional button)
 */
export default function EmptyState({ icon: Icon = Inbox, title = "No data found", description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={32} strokeWidth={1.5} />
      </div>
      <h4 className="empty-state-title">{title}</h4>
      {description && <p className="empty-state-desc">{description}</p>}
      {action && (
        <button className="btn btn-primary btn-sm" onClick={action.onClick} style={{ marginTop: 12 }}>
          {action.label}
        </button>
      )}
    </div>
  );
}
