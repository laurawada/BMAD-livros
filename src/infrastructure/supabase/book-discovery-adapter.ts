import type { BookCommunityReview, CommunityBook, CommunityFeed } from "@/domain/books";

export type StoredBook = {
  id: string;
  external_id: string;
  title: string;
  author: string;
  cover_url: string | null;
  genre: string | null;
  description: string | null;
};

type FeedBookRow = StoredBook & {
  book_id: string;
  average_rating: number | string | null;
  review_count: number | string;
  last_review_at: string | null;
};

type ReviewRow = {
  id: string;
  book_id: string;
  rating: number | string;
  text: string;
  created_at: string;
  books?: { id: string; external_id: string; title: string; author: string; cover_url: string | null };
};

function supabaseConfig() {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!baseUrl || !anonKey || anonKey.includes("YOUR_DEVELOPMENT")) throw new Error("Supabase is not configured");
  return { baseUrl, anonKey };
}

export function isSupabaseConfigured() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && key && !key.includes("YOUR_DEVELOPMENT"));
}

async function selectRows<T>(tableAndQuery: string): Promise<T[]> {
  const { baseUrl, anonKey } = supabaseConfig();
  const response = await fetch(`${baseUrl}/rest/v1/${tableAndQuery}`, {
    headers: { apikey: anonKey, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Supabase read failed (${response.status})`);
  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) throw new Error("Supabase returned an invalid response");
  return payload as T[];
}

function reviewFromRow(row: ReviewRow): BookCommunityReview {
  return {
    id: row.id,
    bookId: row.book_id,
    rating: Number(row.rating),
    text: row.text,
    createdAt: row.created_at,
    ...(row.books ? {
      bookTitle: row.books.title,
      bookAuthor: row.books.author,
      bookCoverUrl: row.books.cover_url,
      externalId: row.books.external_id,
    } : {}),
  };
}

function storedBook(table: StoredBook) {
  return {
    id: table.id,
    title: table.title,
    authors: table.author ? [table.author] : [],
    categories: table.genre ? [table.genre] : [],
    coverUrl: table.cover_url,
    description: table.description ?? "",
    googleBooksUrl: `https://books.google.com/books?id=${encodeURIComponent(table.external_id)}`,
  };
}

export async function findBookByLocalId(id: string): Promise<StoredBook | null> {
  const rows = await selectRows<StoredBook>(`books?select=id,external_id,title,author,cover_url,genre,description&id=eq.${encodeURIComponent(id)}&limit=1`);
  return rows[0] ?? null;
}

export async function findBookByExternalId(externalId: string): Promise<StoredBook | null> {
  const rows = await selectRows<StoredBook>(`books?select=id,external_id,title,author,cover_url,genre,description&external_id=eq.${encodeURIComponent(externalId)}&limit=1`);
  return rows[0] ?? null;
}

export async function readBookCommunity(bookId: string) {
  const [summaryRows, reviewRows, vibeRows] = await Promise.all([
    selectRows<FeedBookRow>(`book_discovery_feed?select=book_id,external_id,title,author,cover_url,genre,description,average_rating,review_count,last_review_at&book_id=eq.${encodeURIComponent(bookId)}&limit=1`),
    selectRows<ReviewRow>(`reviews?select=id,book_id,rating,text,created_at&book_id=eq.${encodeURIComponent(bookId)}&order=created_at.desc&limit=10`),
    selectRows<{ vibe: string }>(`book_vibes?select=vibe&book_id=eq.${encodeURIComponent(bookId)}&order=vibe.asc`),
  ]);
  return {
    averageRating: summaryRows[0]?.average_rating == null ? null : Number(summaryRows[0].average_rating),
    reviewCount: Number(summaryRows[0]?.review_count ?? 0),
    reviews: reviewRows.map(reviewFromRow),
    vibes: [...new Set(vibeRows.map(({ vibe }) => vibe))],
  };
}

export async function readCommunityFeed(): Promise<CommunityFeed> {
  const [bookRows, reviewRows] = await Promise.all([
    selectRows<FeedBookRow>("book_discovery_feed?select=book_id,external_id,title,author,cover_url,average_rating,review_count,last_review_at&review_count=gt.0&order=last_review_at.desc.nullslast&limit=8"),
    selectRows<ReviewRow>("reviews?select=id,book_id,rating,text,created_at,books!inner(id,external_id,title,author,cover_url)&order=created_at.desc&limit=6"),
  ]);
  const books: CommunityBook[] = bookRows.map((book) => ({
    id: book.book_id,
    externalId: book.external_id,
    title: book.title,
    author: book.author || "Autor desconhecido",
    coverUrl: book.cover_url,
    averageRating: Number(book.average_rating ?? 0),
    reviewCount: Number(book.review_count),
  }));
  return { books, reviews: reviewRows.map(reviewFromRow) };
}

export async function readRatingsByExternalIds(externalIds: string[]) {
  if (externalIds.length === 0) return new Map<string, number>();
  const escapedIds = externalIds.map((id) => `"${id.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`);
  const rows = await selectRows<Pick<FeedBookRow, "external_id" | "average_rating">>(
    `book_discovery_feed?select=external_id,average_rating&external_id=${encodeURIComponent(`in.(${escapedIds.join(",")})`)}`,
  );
  return new Map(rows.flatMap((row) => row.average_rating == null ? [] : [[row.external_id, Number(row.average_rating)] as const]));
}

export { storedBook };
