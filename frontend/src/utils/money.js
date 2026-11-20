/**
 * Money helpers. Every amount in this app is an INTEGER number of centavos
 * (PHP 85.50 is 8550), so there is no floating-point rounding error.
 * Only this function turns centavos into text.
 */
export function formatPHP(cents) {
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new TypeError(`formatPHP expects non-negative integer centavos, got ${cents}`);
  }
  const pesos = Math.floor(cents / 100);
  const centavos = String(cents % 100).padStart(2, "0");
  return `PHP ${pesos.toLocaleString("en-US")}.${centavos}`;
}
