import { useEffect, useRef, useState } from "react";

/**
 * Whole-number quantity field limited to 1..max.
 *
 * onChange(n) is called with a valid whole number, or with null while the typed
 * text is invalid (so a parent can disable "Add to Cart"). When the field loses
 * focus with invalid text it snaps back to the last valid value.
 */
export default function QuantityInput({ value, max, onChange, disabled = false, label = "Quantity" }) {
  const [draft, setDraft] = useState(String(value));
  const [error, setError] = useState("");
  const lastValid = useRef(value);

  // Accept corrected values coming from the parent (e.g. after a server check).
  useEffect(() => {
    if (value !== null) {
      lastValid.current = value;
      setDraft(String(value));
      setError("");
    }
  }, [value]);

  function problemWith(text) {
    if (!/^\d+$/.test(text.trim())) return "Enter a whole number.";
    const n = Number(text);
    if (n < 1) return "Quantity must be at least 1.";
    if (n > max) return `Only ${max} available.`;
    return "";
  }

  function handleChange(event) {
    const text = event.target.value;
    setDraft(text);
    const problem = problemWith(text);
    setError(problem);
    if (problem) {
      onChange(null);
    } else {
      lastValid.current = Number(text);
      onChange(lastValid.current);
    }
  }

  function step(delta) {
    const next = Math.min(max, Math.max(1, lastValid.current + delta));
    lastValid.current = next;
    setDraft(String(next));
    setError("");
    onChange(next);
  }

  function handleBlur() {
    if (error) {
      setDraft(String(lastValid.current));
      setError("");
      onChange(lastValid.current);
    }
  }

  return (
    <div className="qty-wrap">
      <div className="qty">
        <button type="button" className="qty-btn" aria-label="Decrease quantity"
          onClick={() => step(-1)} disabled={disabled || lastValid.current <= 1}>
          -
        </button>
        <input className="qty-input" type="text" inputMode="numeric" aria-label={label}
          value={draft} onChange={handleChange} onBlur={handleBlur} disabled={disabled}
          aria-invalid={error ? "true" : "false"} />
        <button type="button" className="qty-btn" aria-label="Increase quantity"
          onClick={() => step(1)} disabled={disabled || lastValid.current >= max}>
          +
        </button>
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}
