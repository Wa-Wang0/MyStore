/**
 * Cart logic. The cart is a list of { productId, quantity } kept in the browser's
 * localStorage so it survives a refresh. It stores NO prices: prices and stock
 * always come from the server (POST /api/cart/validate/).
 *
 * The functions that change a cart are pure (items in, items out) so they are
 * easy to test and to explain.
 */
export const CART_KEY = "cubestore_cart_v1";

const isWholeNumber = (n) => Number.isSafeInteger(n);

/** Drop anything malformed and merge duplicate products. */
export function sanitize(raw) {
  if (!Array.isArray(raw)) return [];
  const merged = new Map();
  for (const entry of raw) {
    const id = entry?.productId;
    const qty = entry?.quantity;
    if (!isWholeNumber(id) || id < 1 || !isWholeNumber(qty) || qty < 1) continue;
    merged.set(id, (merged.get(id) ?? 0) + qty);
  }
  return [...merged].map(([productId, quantity]) => ({ productId, quantity }));
}

function getStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // storage blocked (private mode, etc.)
  }
}

export function loadCart() {
  try {
    return sanitize(JSON.parse(getStorage()?.getItem(CART_KEY) ?? "[]"));
  } catch {
    return [];
  }
}

export function saveCart(items) {
  try {
    getStorage()?.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    /* ignore: the cart still works in memory for this session */
  }
}

/**
 * Add `quantity` of a product. Adding a product already in the cart increases
 * its quantity (no duplicate rows) and the total may never exceed `stock`.
 * Returns { items, error }; on error the cart is unchanged.
 */
export function addToItems(items, productId, quantity, stock) {
  if (!isWholeNumber(quantity) || quantity < 1) {
    return { items, error: "Quantity must be a whole number of at least 1." };
  }
  if (!isWholeNumber(stock) || stock < 1) {
    return { items, error: "This item is out of stock." };
  }
  const existing = items.find((i) => i.productId === productId);
  const inCart = existing ? existing.quantity : 0;
  if (inCart + quantity > stock) {
    const message =
      inCart >= stock
        ? `Only ${stock} in stock, and you already have all of them in your cart.`
        : `Only ${stock} in stock. You already have ${inCart} in your cart.`;
    return { items, error: message };
  }
  const next = existing
    ? items.map((i) => (i.productId === productId ? { ...i, quantity: inCart + quantity } : i))
    : [...items, { productId, quantity }];
  return { items: next, error: null };
}

/** Set an exact quantity (1..stock). Returns { items, error }. */
export function setItemQuantity(items, productId, quantity, stock) {
  if (!isWholeNumber(quantity) || quantity < 1) {
    return { items, error: "Quantity must be a whole number of at least 1." };
  }
  if (quantity > stock) {
    return { items, error: `Only ${stock} available.` };
  }
  return {
    items: items.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
    error: null,
  };
}

export const removeFromItems = (items, productId) =>
  items.filter((i) => i.productId !== productId);

export const countUnits = (items) => items.reduce((sum, i) => sum + i.quantity, 0);
