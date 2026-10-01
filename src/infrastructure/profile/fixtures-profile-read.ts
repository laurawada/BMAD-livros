import type { ProfileReadPort } from "@/domain/profile/profile-read-port";
import type {
  PublicProfile,
  PublicReview,
  RecentRead,
} from "@/domain/profile/types";

// In-memory stand-in for the deferred Supabase RLS-backed ProfileReadPort (AD-6).
//
// This adapter exists only for the ISOLATED build of Epic 4: it lets the public
// profile UI render against the agreed contract while the database integration
// waits for Epics 1 & 3. It mirrors the real public projection — Lido-only
// recent reads carrying just book + date, derived averages, public reviews —
// so swapping in the RLS-backed adapter later changes the data source, not the
// contract. The seed data below is the raw shape (what a database would hold);
// the public projection is DERIVED from it at read time, never stored.

interface SeedBook {
  id: string;
  title: string;
  coverUrl: string | null;
}

// Raw shelf entry — the full private shape a database row would have. Only Lido
// entries are ever projected into a public profile, and only as book + date.
interface SeedShelfEntry {
  id: string;
  bookId: string;
  status: "Quero ler" | "Lendo" | "Lido" | "Abandonei";
  updatedAt: string; // ISO 8601 — last status-change time.
}

// Raw review — `active: false` represents a soft-deleted/inactive review that
// must NOT contribute to the derived average or appear publicly.
interface SeedReview {
  id: string;
  bookId: string;
  rating: number;
  text: string;
  createdAt: string; // ISO 8601
  active: boolean;
}

interface SeedProfile {
  id: string;
  name: string;
  profileImageUrl: string | null;
  shelf: SeedShelfEntry[];
  reviews: SeedReview[];
}

const BOOKS: Record<string, SeedBook> = {
  "book-duna": {
    id: "book-duna",
    title: "Duna",
    coverUrl: "https://covers.openlibrary.org/b/id/11475154-L.jpg",
  },
  "book-neuromancer": {
    id: "book-neuromancer",
    title: "Neuromancer",
    coverUrl: "https://covers.openlibrary.org/b/id/9255566-L.jpg",
  },
  "book-fundacao": {
    id: "book-fundacao",
    title: "Fundação",
    coverUrl: "https://covers.openlibrary.org/b/id/8231856-L.jpg",
  },
  "book-ensaio-cegueira": {
    id: "book-ensaio-cegueira",
    title: "Ensaio sobre a Cegueira",
    coverUrl: null,
  },
  "book-torto-arado": {
    id: "book-torto-arado",
    title: "Torto Arado",
    coverUrl: "https://covers.openlibrary.org/b/id/12749386-L.jpg",
  },
};

const SEED_PROFILES: Record<string, SeedProfile> = {
  // (a) Profile WITH photo, several Lido reads and active reviews -> non-null average.
  "ana-souza": {
    id: "ana-souza",
    name: "Ana Souza",
    profileImageUrl: "https://i.pravatar.cc/240?img=47",
    shelf: [
      { id: "shelf-ana-1", bookId: "book-duna", status: "Lido", updatedAt: "2026-02-18T14:30:00.000Z" },
      { id: "shelf-ana-2", bookId: "book-neuromancer", status: "Lido", updatedAt: "2026-03-05T09:15:00.000Z" },
      { id: "shelf-ana-3", bookId: "book-fundacao", status: "Lido", updatedAt: "2026-03-05T09:15:00.000Z" },
      // Non-Lido entries must never surface in the public projection.
      { id: "shelf-ana-4", bookId: "book-torto-arado", status: "Lendo", updatedAt: "2026-03-20T20:00:00.000Z" },
      { id: "shelf-ana-5", bookId: "book-ensaio-cegueira", status: "Quero ler", updatedAt: "2026-03-21T11:00:00.000Z" },
    ],
    reviews: [
      { id: "review-ana-1", bookId: "book-duna", rating: 5, text: "Épico absoluto, releria sem pensar duas vezes.", createdAt: "2026-02-18T15:00:00.000Z", active: true },
      { id: "review-ana-2", bookId: "book-neuromancer", rating: 4, text: "Denso e visionário; a prosa exige atenção.", createdAt: "2026-03-05T10:00:00.000Z", active: true },
      { id: "review-ana-3", bookId: "book-fundacao", rating: 4.5, text: "A escala das ideias ainda impressiona.", createdAt: "2026-03-06T08:30:00.000Z", active: true },
      // Inactive review: excluded from the average and from public reviews.
      { id: "review-ana-4", bookId: "book-torto-arado", rating: 2, text: "Rascunho antigo, não deveria contar.", createdAt: "2026-01-02T12:00:00.000Z", active: false },
    ],
  },
  // (b) Profile WITHOUT photo -> exercises the initials avatar; has reviews so the average renders.
  "bruno-lima": {
    id: "bruno-lima",
    name: "Bruno Lima",
    profileImageUrl: null,
    shelf: [
      { id: "shelf-bruno-1", bookId: "book-torto-arado", status: "Lido", updatedAt: "2026-03-10T18:45:00.000Z" },
      { id: "shelf-bruno-2", bookId: "book-ensaio-cegueira", status: "Lido", updatedAt: "2026-01-28T08:00:00.000Z" },
    ],
    reviews: [
      { id: "review-bruno-1", bookId: "book-torto-arado", rating: 5, text: "Uma das leituras mais marcantes do ano.", createdAt: "2026-03-10T19:00:00.000Z", active: true },
      { id: "review-bruno-2", bookId: "book-ensaio-cegueira", rating: 4, text: "Perturbador e necessário.", createdAt: "2026-01-28T09:00:00.000Z", active: true },
    ],
  },
};

/**
 * Derive the public average from active review ratings (AD-4): simple AVG, never
 * stored, `null` when the user has no active reviews.
 */
function deriveAverageRating(reviews: SeedReview[]): number | null {
  const active = reviews.filter((review) => review.active);
  if (active.length === 0) {
    return null;
  }
  const sum = active.reduce((total, review) => total + review.rating, 0);
  return sum / active.length;
}

/**
 * Project the raw shelf into the public Lido-only recent-reads list (AD-6):
 * only book + date, ordered `updatedAt DESC, id DESC`. No status leaves this
 * function.
 */
function deriveRecentReads(shelf: SeedShelfEntry[]): RecentRead[] {
  return shelf
    .filter((entry) => entry.status === "Lido")
    .slice()
    .sort((a, b) => {
      if (a.updatedAt !== b.updatedAt) {
        return a.updatedAt < b.updatedAt ? 1 : -1; // updatedAt DESC
      }
      return a.id < b.id ? 1 : -1; // id DESC
    })
    .map((entry) => {
      const book = BOOKS[entry.bookId];
      return {
        bookId: book.id,
        bookTitle: book.title,
        bookCoverUrl: book.coverUrl,
        completedAt: entry.updatedAt,
      };
    });
}

/** Project active reviews into public reviews ordered `createdAt DESC, id DESC`. */
function deriveReviews(reviews: SeedReview[]): PublicReview[] {
  return reviews
    .filter((review) => review.active)
    .slice()
    .sort((a, b) => {
      if (a.createdAt !== b.createdAt) {
        return a.createdAt < b.createdAt ? 1 : -1; // createdAt DESC
      }
      return a.id < b.id ? 1 : -1; // id DESC
    })
    .map((review) => {
      const book = BOOKS[review.bookId];
      return {
        id: review.id,
        bookId: book.id,
        bookTitle: book.title,
        rating: review.rating,
        text: review.text,
        createdAt: review.createdAt,
      };
    });
}

function toPublicProfile(seed: SeedProfile): PublicProfile {
  return {
    id: seed.id,
    name: seed.name,
    profileImageUrl: seed.profileImageUrl,
    readCount: seed.shelf.filter((entry) => entry.status === "Lido").length,
    averageRating: deriveAverageRating(seed.reviews),
    recentReads: deriveRecentReads(seed.shelf),
    reviews: deriveReviews(seed.reviews),
  };
}

export const fixturesProfileReadAdapter: ProfileReadPort = {
  async getPublicProfile(userId: string): Promise<PublicProfile | null> {
    const seed = SEED_PROFILES[userId];
    // (c) Unknown id -> null.
    return seed ? toPublicProfile(seed) : null;
  },
};
