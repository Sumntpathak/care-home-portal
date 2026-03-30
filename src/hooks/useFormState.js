import { useState, useCallback } from "react";

/**
 * useFormState — eliminates the duplicated `const set = (k,v) => setForm(...)` pattern
 *
 * Usage:
 *   const [form, set, reset] = useFormState({ name: "", phone: "", age: "" });
 *   <input value={form.name} onChange={e => set("name", e.target.value)} />
 *   <button onClick={reset}>Clear</button>
 */
export function useFormState(initialValues) {
  const [form, setForm] = useState(initialValues);

  const set = useCallback((key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => {
    setForm(initialValues);
  }, [initialValues]);

  const setAll = useCallback((values) => {
    setForm(prev => ({ ...prev, ...values }));
  }, []);

  return [form, set, reset, setAll];
}
