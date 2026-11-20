import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  CART_KEY, addToItems, countUnits, loadCart, removeFromItems,
  sanitize, saveCart, setItemQuantity,
} from "./cart.js";

// Minimal in-memory localStorage so persistence can be tested in Node.
beforeEach(() => {
  const data = new Map();
  globalThis.localStorage = {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
  };
});

test("adding the same product merges into one row", () => {
  let items = [];
  items = addToItems(items, 1, 1, 5).items;
  items = addToItems(items, 1, 2, 5).items;
  assert.deepEqual(items, [{ productId: 1, quantity: 3 }]);
});

test("cannot exceed stock, including what is already in the cart", () => {
  const start = [{ productId: 1, quantity: 4 }];
  const result = addToItems(start, 1, 2, 5);
  assert.match(result.error, /Only 5 in stock/);
  assert.deepEqual(result.items, start); // unchanged
});

test("out of stock and invalid quantities are rejected", () => {
  assert.ok(addToItems([], 1, 1, 0).error);
  for (const bad of [0, -1, 1.5, NaN, "2", null]) {
    assert.ok(addToItems([], 1, bad, 5).error, `quantity ${bad}`);
  }
});

test("setItemQuantity enforces 1..stock", () => {
  const items = [{ productId: 1, quantity: 1 }];
  assert.equal(setItemQuantity(items, 1, 3, 5).items[0].quantity, 3);
  assert.ok(setItemQuantity(items, 1, 6, 5).error);
  assert.ok(setItemQuantity(items, 1, 0, 5).error);
});

test("remove and count", () => {
  const items = [{ productId: 1, quantity: 2 }, { productId: 2, quantity: 1 }];
  assert.equal(countUnits(items), 3);
  assert.deepEqual(removeFromItems(items, 1), [{ productId: 2, quantity: 1 }]);
});

test("cart persists across a 'refresh' (save then load)", () => {
  saveCart([{ productId: 7, quantity: 2 }]);
  assert.deepEqual(loadCart(), [{ productId: 7, quantity: 2 }]);
});

test("corrupted storage falls back to an empty cart", () => {
  globalThis.localStorage.setItem(CART_KEY, "{not json");
  assert.deepEqual(loadCart(), []);
});

test("sanitize drops bad rows and merges duplicates", () => {
  const raw = [
    { productId: 1, quantity: 1 }, { productId: 1, quantity: 2 },
    { productId: "x", quantity: 1 }, { productId: 2, quantity: 0 }, null,
  ];
  assert.deepEqual(sanitize(raw), [{ productId: 1, quantity: 3 }]);
});
