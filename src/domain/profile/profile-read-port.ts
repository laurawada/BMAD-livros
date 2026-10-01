import type { PublicProfile } from "./types";

/**
 * Port for reading public-safe profile data (Epic 4 / Story 4.1).
 *
 * Implementations return only the public projection described by `PublicProfile`.
 * The contract shape itself is the first line of defense: private shelf fields
 * and non-Lido statuses are not representable in the return type, so they cannot
 * leak through a profile read.
 *
 * AD-6: the authoritative enforcement is the database authorization boundary
 * (RLS) — the public Lido-only projection exposes only profile id, book id and
 * Shelf.updatedAt, ordered `updatedAt DESC, id DESC`. That real enforcement is
 * DEFERRED to the Supabase-backed adapter once Epics 1 & 3 land; for now the
 * in-memory fixtures adapter honors the same shape.
 */
export interface ProfileReadPort {
  /**
   * Return the public profile for `userId`, or `null` when no such profile
   * exists.
   */
  getPublicProfile(userId: string): Promise<PublicProfile | null>;
}
