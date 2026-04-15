/**
 * Spinner — canonical loading indicator for the entire app.
 * Usage: <Spinner /> | <Spinner size="lg" /> | <Spinner center />
 */
const SIZES = {
  xs: { width: 12, height: 12 },
  sm: { width: 16, height: 16 },
  md: { width: 20, height: 20 },
  lg: { width: 28, height: 28 },
  xl: { width: 36, height: 36 },
};

export default function Spinner({ size = "md", center = false, style = {} }) {
  const dim = SIZES[size] || SIZES.md;
  const el = <span className="spinner" style={{ width: dim.width, height: dim.height, flexShrink: 0, ...style }} />;
  if (!center) return el;
  return (
    <div className="loading-box" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      {el}
    </div>
  );
}
