import type { BookDetails } from "@/domain/books";
import type { BookDetailsPort } from "@/domain/books";
import { findBookByExternalId, findBookByLocalId, isSupabaseConfigured, readBookCommunity, storedBook, type StoredBook } from "@/infrastructure/supabase/book-discovery-adapter";

export class BookDetailsNotFoundError extends Error {}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function snapshotDetails(stored: Awaited<ReturnType<typeof findBookByLocalId>>): BookDetails {
  if (!stored) throw new BookDetailsNotFoundError("Book not found");
  return {
    ...storedBook(stored),
    id: stored.external_id,
    localId: stored.id,
    averageRating: null,
    reviewCount: 0,
    reviews: [],
    vibes: [],
  };
}

export async function getBookDetails(identifier: string, provider: BookDetailsPort): Promise<BookDetails> {
  const isLocalId = uuidPattern.test(identifier);
  let stored: StoredBook | null = null;
  let communityUnavailable = false;

  if (isLocalId) {
    stored = await findBookByLocalId(identifier);
    if (!stored) throw new BookDetailsNotFoundError("Book not found");
  } else if (isSupabaseConfigured()) {
    try {
      stored = await findBookByExternalId(identifier);
    } catch (error) {
      communityUnavailable = true;
      console.error("Local book snapshot lookup failed", error);
    }
  }

  let details: BookDetails;
  if (stored) {
    if (isLocalId) {
      details = snapshotDetails(stored);
    } else {
      try {
        details = await provider.getByExternalId(stored.external_id);
        details.localId = stored.id;
      } catch (error) {
        details = snapshotDetails(stored);
        console.warn("Google Books unavailable; using local book snapshot", error);
      }
    }
    try {
      const community = await readBookCommunity(stored.id);
      details.averageRating = community.averageRating;
      details.reviewCount = community.reviewCount;
      details.reviews = community.reviews;
      details.vibes = community.vibes;
    } catch (error) {
      communityUnavailable = true;
      console.error("Local book community lookup failed", error);
    }
    details.communityUnavailable = communityUnavailable;
    return details;
  }

  details = await provider.getByExternalId(identifier);
  details.communityUnavailable = communityUnavailable;
  return details;
}
