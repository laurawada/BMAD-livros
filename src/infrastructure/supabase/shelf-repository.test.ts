import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createShelfRepository } from "./shelf-repository";

function createQueryClient(result: unknown) {
  const calls: unknown[][] = [];
  const query = {
    update(values: unknown) {
      calls.push(["update", values]);
      return query;
    },
    select(columns: string) {
      calls.push(["select", columns]);
      return query;
    },
    eq(column: string, value: string) {
      calls.push(["eq", column, value]);
      return query;
    },
    order(column: string, options: unknown) {
      calls.push(["order", column, options]);
      return Promise.resolve(result);
    },
    maybeSingle() {
      return Promise.resolve(result);
    },
  };

  return {
    client: {
      from(table: string) {
        calls.push(["from", table]);
        return query;
      },
    } as unknown as SupabaseClient,
    calls,
  };
}

const shelfRow = {
  id: "shelf-1",
  book_id: "book-1",
  status: "Lendo",
  updated_at: "2026-10-01T10:00:00.000Z",
  books: {
    external_id: "google-1",
    title: "Book",
    author: "Author",
    cover_url: null,
    genre: "Fiction",
    description: null,
  },
};

test("maps the flat adoption RPC result to a shelf entry", async () => {
  const client = {
    rpc: async () => ({
      data: [
        {
          id: "shelf-1",
          book_id: "book-1",
          status: "Quero ler",
          updated_at: "2026-10-01T10:00:00.000Z",
          external_id: "google-1",
          title: "Book",
          author: "Author",
          cover_url: null,
          genre: "Fiction",
          description: null,
        },
      ],
      error: null,
    }),
  } as unknown as SupabaseClient;

  const entry = await createShelfRepository(client).addBookToShelf(
    "owner-1",
    { externalId: "google-1", title: "Book", author: "Author" },
    '{"externalId":"google-1"}',
    "signed-test-payload",
  );

  assert.deepEqual(entry, {
    id: "shelf-1",
    bookId: "book-1",
    status: "Quero ler",
    updatedAt: "2026-10-01T10:00:00.000Z",
    book: {
      externalId: "google-1",
      title: "Book",
      author: "Author",
      coverUrl: null,
      genre: "Fiction",
      description: null,
    },
  });
});

test("updates a status on the owner row and maps the returned book relation", async () => {
  const { client, calls } = createQueryClient({ data: shelfRow, error: null });

  const entry = await createShelfRepository(client).changeShelfStatus(
    "owner-1",
    "book-1",
    "Lido",
  );

  assert.equal(entry?.status, "Lendo");
  assert.equal(entry?.book.title, "Book");
  assert.deepEqual(calls.slice(0, 4), [
    ["from", "shelves"],
    ["update", { status: "Lido" }],
    ["eq", "user_id", "owner-1"],
    ["eq", "book_id", "book-1"],
  ]);
});

test("lists shelf entries in update order and maps related book fields", async () => {
  const { client, calls } = createQueryClient({ data: [shelfRow], error: null });

  const entries = await createShelfRepository(client).getShelf("owner-1");

  assert.equal(entries.length, 1);
  assert.equal(entries[0].book.externalId, "google-1");
  assert.equal(entries[0].book.genre, "Fiction");
  assert.deepEqual(calls.at(-1), [
    "order",
    "updated_at",
    { ascending: false },
  ]);
});