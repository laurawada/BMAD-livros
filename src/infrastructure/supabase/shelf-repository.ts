import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isShelfStatus } from "@/domain/shelf";
import type { BookSnapshot, ShelfEntry } from "@/domain/shelf";
import type { ShelfRepository } from "@/domain/ports/shelf-repository";

type BookRow = {
  external_id: string;
  title: string;
  author: string;
  cover_url: string | null;
  genre: string | null;
  description: string | null;
};

type ShelfRow = {
  id: string;
  book_id: string;
  status: string;
  updated_at: string;
  external_id?: string;
  title?: string;
  author?: string;
  cover_url?: string | null;
  genre?: string | null;
  description?: string | null;
  book?: BookRow;
  books?: BookRow | null;
};

const shelfSelection =
  "id, book_id, status, updated_at, books!inner(external_id, title, author, cover_url, genre, description)";

function toShelfEntry(row: ShelfRow): ShelfEntry {
  const book =
    row.book ??
    row.books ??
    (row.external_id && row.title !== undefined && row.author !== undefined
      ? {
          external_id: row.external_id,
          title: row.title,
          author: row.author,
          cover_url: row.cover_url ?? null,
          genre: row.genre ?? null,
          description: row.description ?? null,
        }
      : null);
  if (!book || !isShelfStatus(row.status)) {
    throw new Error("Invalid shelf row returned by Supabase.");
  }

  const snapshot: BookSnapshot = {
    externalId: book.external_id,
    title: book.title,
    author: book.author,
    coverUrl: book.cover_url,
    genre: book.genre,
    description: book.description,
  };

  return {
    id: row.id,
    bookId: row.book_id,
    status: row.status,
    updatedAt: row.updated_at,
    book: snapshot,
  };
}

export function createShelfRepository(
  client: SupabaseClient,
): ShelfRepository {
  return {
    async addBookToShelf(_userId, snapshot, signedPayload, signature) {
      const { data, error } = await client.rpc("add_book_to_shelf", {
        p_external_id: snapshot.externalId,
        p_title: snapshot.title,
        p_author: snapshot.author,
        p_snapshot_payload: signedPayload,
        p_snapshot_signature: signature,
        p_cover_url: snapshot.coverUrl ?? null,
        p_genre: snapshot.genre ?? null,
        p_description: snapshot.description ?? null,
      });

      if (error) throw error;
      const rows = data as unknown as ShelfRow[] | null;
      if (!rows?.[0]) throw new Error("Shelf RPC returned no entry.");
      return toShelfEntry(rows[0]);
    },

    async changeShelfStatus(userId, bookId, status) {
      const { data, error } = await client
        .from("shelves")
        .update({ status })
        .eq("user_id", userId)
        .eq("book_id", bookId)
        .select(shelfSelection)
        .maybeSingle();

      if (error) throw error;
      return data ? toShelfEntry(data as unknown as ShelfRow) : null;
    },

    async getShelf(userId) {
      const { data, error } = await client
        .from("shelves")
        .select(shelfSelection)
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return (data as unknown as ShelfRow[]).map(toShelfEntry);
    },
  };
}