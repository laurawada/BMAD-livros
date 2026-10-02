// Typed re-export of the single shared rating formatter (AD-4).
//
// The runtime implementation lives in ./format.mjs so the node:test suite can
// import the exact shipped code. This module gives the TypeScript/React layers
// typed access to the same function — do not fork the logic here.
import {
  formatAverageRating as formatAverageRatingImpl,
  EMPTY_RATING_PLACEHOLDER as EMPTY_RATING_PLACEHOLDER_IMPL,
} from "./format.mjs";

/** Placeholder shown when there is no average to display. */
export const EMPTY_RATING_PLACEHOLDER: string = EMPTY_RATING_PLACEHOLDER_IMPL;

/**
 * Format a derived average rating for display: at most two decimals, trailing
 * zeros trimmed, placeholder for `null`. The ONE formatter used everywhere an
 * average renders (AD-4).
 */
export function formatAverageRating(value: number | null): string {
  return formatAverageRatingImpl(value);
}
