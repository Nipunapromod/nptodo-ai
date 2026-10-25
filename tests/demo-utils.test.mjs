import test from "node:test";
import assert from "node:assert/strict";
import { formatPreviewCount, normalizeTaskText } from "../lib/demo-utils.mjs";

test("formatPreviewCount formats zero and integer values", () => {
  assert.equal(formatPreviewCount(0), "0");
  assert.equal(formatPreviewCount(128), "128");
});

test("formatPreviewCount rejects negative and non-finite values", () => {
  assert.throws(() => formatPreviewCount(-1), RangeError);
  assert.throws(() => formatPreviewCount(Number.NaN), RangeError);
});

test("normalizeTaskText trims and collapses whitespace", () => {
  assert.equal(normalizeTaskText("  revise   Physics  notes  "), "revise Physics notes");
});

test("normalizeTaskText rejects non-string values", () => {
  assert.throws(() => normalizeTaskText(null), TypeError);
});
