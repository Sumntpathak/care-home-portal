import { forwardRef, useId } from "react";

/**
 * FormField — canonical label + control + hint/error wrapper.
 *
 * Usage:
 *   <FormField label="Patient name" required hint="Full legal name" error={errors.name}>
 *     <Input value={name} onChange={e => setName(e.target.value)} />
 *   </FormField>
 *
 * Or with render-prop for id wiring:
 *   <FormField label="Phone" error={err}>
 *     {({ id }) => <Input id={id} ... />}
 *   </FormField>
 */
export function FormField({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
  className = "",
  inline = false,
}) {
  const autoId = useId();
  const id = htmlFor || `ff-${autoId}`;

  const rendered = typeof children === "function" ? children({ id }) : children;

  return (
    <div className={`sc-field ${inline ? "sc-field--inline" : ""} ${error ? "sc-field--error" : ""} ${className}`.trim()}>
      {label && (
        <label className="sc-field__label" htmlFor={id}>
          {label}
          {required && <span className="sc-field__req" aria-hidden="true"> *</span>}
        </label>
      )}
      <div className="sc-field__control">{rendered}</div>
      {error ? (
        <p className="sc-field__error" role="alert">{error}</p>
      ) : hint ? (
        <p className="sc-field__hint">{hint}</p>
      ) : null}
    </div>
  );
}

/** Input — styled text input. Accepts all native input props. */
export const Input = forwardRef(function Input({ className = "", ...props }, ref) {
  return <input ref={ref} className={`sc-input ${className}`.trim()} {...props} />;
});

/** Textarea — styled multi-line input. */
export const Textarea = forwardRef(function Textarea({ className = "", rows = 3, ...props }, ref) {
  return <textarea ref={ref} rows={rows} className={`sc-input sc-input--textarea ${className}`.trim()} {...props} />;
});

/** Select — styled dropdown. Pass <option>s as children. */
export const Select = forwardRef(function Select({ className = "", children, ...props }, ref) {
  return (
    <select ref={ref} className={`sc-input sc-input--select ${className}`.trim()} {...props}>
      {children}
    </select>
  );
});

export default FormField;
