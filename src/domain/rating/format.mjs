// Shared rating formatter (AD-4).
//
// Aggregate ratings are DERIVED from active reviews and never stored; they are
// rounded ONLY for display, to at most two decimal places, through this single
// shared formatter. This is the one place the two-decimal rule lives so every
// average renders identically across the app.
//
// The runtime logic lives in this .mjs module so the built-in `node --test`
// suite can import and exercise the exact shipped code (see
// scripts/format-rating.test.mjs), while the sibling format.ts re-exports it
// with types for the TypeScript/React layers.

// Placeholder shown when there is no average to display (e.g. no active reviews).
export const EMPTY_RATING_PLACEHOLDER = "—";

/**
 * Format an average rating for display.
 *
 * - Rounds to at most two decimal places.
 * - Trims trailing zeros (4 -> "4", 4.5 -> "4.5", 4.333 -> "4.33").
 * - Returns a placeholder for null / non-finite input.
 *
 * @param {number | null} value
 * @returns {string}
 */
export function formatAverageRating(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return EMPTY_RATING_PLACEHOLDER;
  }

  // Round half away from zero at two decimals, then drop trailing zeros.
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return String(rounded);
}
