// Public profile read model (Epic 4 / Story 4.1).
//
// These types are the public-safe projection of a user's profile and reading
// activity. They deliberately carry ONLY data that any visitor may see; private
// shelf state never enters this shape. The real enforcement is the database RLS
// boundary (AD-6) — deferred until the Supabase-backed adapter lands (Epics 1 & 3).

/**
 * A recent completed read exposed on a public profile.
 *
 * AD-6: the public projection of another user's activity is Lido-only and
 * carries ONLY profile + book + date. There is intentionally NO status field
 * here — "Lido" is implied — so no other Shelf status/field can travel through
 * a profile query. `completedAt` is the ISO 8601 serialization of the Lido
 * transition's `Shelf.updatedAt` (the last status-change time).
 */
export interface RecentRead {
  bookId: string;
  bookTitle: string;
  bookCoverUrl: string | null;
  completedAt: string; // ISO 8601; maps to Shelf.updatedAt of the Lido transition.
}

/** A public review authored by the profile's user. */
export interface PublicReview {
  id: string;
  bookId: string;
  bookTitle: string;
  rating: number; // exact half-star numeric (1.0–5.0)
  text: string;
  createdAt: string; // ISO 8601
}

/**
 * Public-safe view of a profile and its reading activity.
 *
 * `averageRating` is DERIVED from the user's active reviews at read time and is
 * never stored (AD-4); it is `null` when the user has no active reviews.
 */
export interface PublicProfile {
  id: string;
  name: string;
  profileImageUrl: string | null;
  readCount: number; // count of Lido shelf entries
  averageRating: number | null; // derived AVG of active reviews; null when none
  recentReads: RecentRead[]; // pre-filtered Lido, ordered updatedAt DESC, id DESC
  reviews: PublicReview[]; // ordered createdAt DESC, id DESC
}
