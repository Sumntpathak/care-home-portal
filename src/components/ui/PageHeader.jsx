/**
 * PageHeader — standardized top bar for every page.
 * Class-driven so it inherits theme tokens automatically.
 *
 * <PageHeader
 *   breadcrumb={["Care", "Patients"]}
 *   title="Patient Registry"
 *   subtitle="125 active residents"
 *   actions={<button className="btn btn-primary">+ Add</button>}
 *   eyebrow={<span className="chip">Live</span>}
 * />
 */
export function PageHeader({ title, subtitle, actions, breadcrumb, eyebrow, sticky = false, className = "" }) {
  return (
    <header className={`sc-page-header ${sticky ? "sc-page-header--sticky" : ""} ${className}`.trim()}>
      <div className="sc-page-header__lede">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="sc-page-header__crumbs" aria-label="Breadcrumb">
            {breadcrumb.map((b, i) => (
              <span key={i} className="sc-page-header__crumb">
                {b}
                {i < breadcrumb.length - 1 && <span className="sc-page-header__crumb-sep" aria-hidden="true">›</span>}
              </span>
            ))}
          </nav>
        )}
        {eyebrow && <div className="sc-page-header__eyebrow">{eyebrow}</div>}
        <h1 className="sc-page-header__title">{title}</h1>
        {subtitle && <p className="sc-page-header__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="sc-page-header__actions">{actions}</div>}
    </header>
  );
}

export default PageHeader;
