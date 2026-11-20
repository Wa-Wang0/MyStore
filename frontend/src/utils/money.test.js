import { test } from "node:test";
import assert from "node:assert/strict";
import { formatPHP } from "./money.js";

test("formats centavos as PHP with two decimals", () => {
  assert.equal(formatPHP(12000), "PHP 120.00");
  assert.equal(formatPHP(8550), "PHP 85.50");
  assert.equal(formatPHP(0), "PHP 0.00");
  assert.equal(formatPHP(5), "PHP 0.05");
  assert.equal(formatPHP(123456), "PHP 1,234.56");
});

test("spec example: 2 x 120.00 + 1 x 85.50 = PHP 325.50", () => {
  const total = 2 * 12000 + 1 * 8550;
  assert.equal(total, 32550);
  assert.equal(formatPHP(total), "PHP 325.50");
});

test("floating point money is the bug we avoid", () => {
  assert.notEqual(0.1 + 0.2, 0.3); // why we never store pesos as decimals
  assert.equal(10 + 20, 30);
});

test("rejects non-integer or negative input", () => {
  assert.throws(() => formatPHP(85.5), TypeError);
  assert.throws(() => formatPHP(-1), TypeError);
  assert.throws(() => formatPHP("100"), TypeError);
});
