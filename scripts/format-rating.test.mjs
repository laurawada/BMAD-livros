import assert from "node:assert/strict";
import test from "node:test";
import {
  EMPTY_RATING_PLACEHOLDER,
  formatAverageRating,
} from "../src/domain/rating/format.mjs";

test("renders whole numbers without decimals", () => {
  assert.equal(formatAverageRating(4), "4");
});

test("keeps a single significant decimal", () => {
  assert.equal(formatAverageRating(4.5), "4.5");
});

test("rounds to at most two decimals", () => {
  assert.equal(formatAverageRating(4.333), "4.33");
});

test("trims trailing zeros from whole-number-with-zeros input", () => {
  assert.equal(formatAverageRating(4.0), "4");
  assert.equal(formatAverageRating(4.5), "4.5");
});

test("returns the placeholder for null", () => {
  assert.equal(formatAverageRating(null), EMPTY_RATING_PLACEHOLDER);
});

test("returns the placeholder for non-finite input", () => {
  assert.equal(formatAverageRating(Number.NaN), EMPTY_RATING_PLACEHOLDER);
});
