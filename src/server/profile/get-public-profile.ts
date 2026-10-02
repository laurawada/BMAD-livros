import { fixturesProfileReadAdapter } from "@/infrastructure/profile/fixtures-profile-read";
import type { ProfileReadPort } from "@/domain/profile/profile-read-port";
import type { PublicProfile, PublicReview, RecentRead } from "@/domain/profile/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const activeAdapter: ProfileReadPort = fixturesProfileReadAdapter;

type BookRow = {
  id: string;
  title: string;
  cover_url: string | null;
};

type ShelfRow = {
  book_id: string;
  status: string;
  updated_at: string;
  books: BookRow | BookRow[] | null;
};

type ReviewRow = {
  id: string;
  book_id: string;
  rating: number | string;
  text: string;
  created_at: string;
  books: BookRow | BookRow[] | null;
};

function one<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

async function getAuthenticatedProfile(userId: string): Promise<PublicProfile | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();
    if (authData.user?.id !== userId) return null;

    const [{ data: shelves, error: shelvesError }, { data: reviews, error: reviewsError }] = await Promise.all([
      supabase.from("shelves").select("book_id,status,updated_at,books(id,title,cover_url)").eq("user_id", userId),
      supabase.from("reviews").select("id,book_id,rating,text,created_at,books(id,title,cover_url)").eq("user_id", userId).order("created_at", { ascending: false }),
    ]);
    if (shelvesError || reviewsError) throw shelvesError ?? reviewsError;

    const shelfRows = (shelves ?? []) as ShelfRow[];
    const reviewRows = (reviews ?? []) as ReviewRow[];
    const recentReads: RecentRead[] = shelfRows
      .filter((row) => row.status === "Lido")
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .map((row) => {
        const book = one(row.books);
        return book ? { bookId: row.book_id, bookTitle: book.title, bookCoverUrl: book.cover_url, completedAt: row.updated_at } : null;
      })
      .filter((row): row is RecentRead => row !== null);
    const publicReviews: PublicReview[] = reviewRows.flatMap((row) => {
      const book = one(row.books);
      return book ? [{ id: row.id, bookId: row.book_id, bookTitle: book.title, rating: Number(row.rating), text: row.text, createdAt: row.created_at }] : [];
    });
    const ratings = publicReviews.map((review) => review.rating);

    return {
      id: userId,
      name: (authData.user.user_metadata?.name as string | undefined) || authData.user.email?.split("@")[0] || "Leitor",
      profileImageUrl: (authData.user.user_metadata?.avatar_url as string | undefined) ?? null,
      readCount: recentReads.length,
      averageRating: ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : null,
      recentReads,
      reviews: publicReviews,
    };
  } catch (error) {
    console.error("Authenticated profile lookup failed.", error);
    return null;
  }
}

export async function getPublicProfile(userId: string): Promise<PublicProfile | null> {
  const fixture = await activeAdapter.getPublicProfile(userId);
  return fixture ?? getAuthenticatedProfile(userId);
}
