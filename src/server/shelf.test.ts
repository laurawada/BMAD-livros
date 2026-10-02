import assert from "node:assert/strict";
import test from "node:test";
import type { ShelfEntry, ShelfStatus } from "@/domain/shelf";
import type { ShelfRepository } from "@/domain/ports/shelf-repository";
import { createShelfService } from "./shelf";

const snapshot = { externalId: "google-1", title: "Book", author: "Author" };
const entry: ShelfEntry = {
  id: "shelf-1",
  bookId: "book-1",
  status: "Quero ler",
  updatedAt: "2026-10-01T10:00:00.000Z",
  book: snapshot,
};

function createRepository(overrides: Partial<ShelfRepository> = {}) {
  const calls: unknown[][] = [];
  const repository: ShelfRepository = {
    async addBookToShelf(userId, book, signedPayload, signature) {
      calls.push(["add", userId, book, signedPayload, signature]);
      return entry;
    },
    async changeShelfStatus(userId, bookId, status) {
      calls.push(["change", userId, bookId, status]);
      return { ...entry, status };
    },
    async getShelf(userId) {
      calls.push(["list", userId]);
      return [entry];
    },
    ...overrides,
  };
  return { repository, calls };
}

test("derives the owner from verified auth before adopting a book", async () => {
  const { repository, calls } = createRepository();
  const service = createShelfService({ getUser: async () => ({ id: "owner-1" }) }, repository);

  assert.equal(await service.addBook(snapshot, "signed-payload", "signature"), entry);
  assert.deepEqual(calls, [
    ["add", "owner-1", snapshot, "signed-payload", "signature"],
  ]);
});

test("rejects unauthenticated reads and writes without touching the repository", async () => {
  const { repository, calls } = createRepository();
  const service = createShelfService({ getUser: async () => null }, repository);

  await assert.rejects(
    service.addBook(snapshot, "signed-payload", "signature"),
    { code: "UNAUTHENTICATED" },
  );
  await assert.rejects(service.getShelf(), { code: "UNAUTHENTICATED" });
  assert.deepEqual(calls, []);
});

test("validates status before updating the owner's existing shelf row", async () => {
  const { repository, calls } = createRepository();
  const service = createShelfService({ getUser: async () => ({ id: "owner-1" }) }, repository);

  const updated = await service.changeStatus("book-1", "Lido");
  assert.equal(updated.status, "Lido");
  assert.deepEqual(calls, [["change", "owner-1", "book-1", "Lido" as ShelfStatus]]);
  await assert.rejects(service.changeStatus("book-1", "Removido"), {
    code: "INVALID_STATUS",
  });
  assert.equal(calls.length, 1);
});

test("reports a missing owner entry without exposing repository details", async () => {
  const { repository } = createRepository({
    async changeShelfStatus() {
      return null;
    },
  });
  const service = createShelfService({ getUser: async () => ({ id: "owner-1" }) }, repository);

  await assert.rejects(service.changeStatus("book-1", "Lendo"), {
    name: "ShelfUseCaseError",
    code: "NOT_FOUND",
    message: "Este livro não está na sua estante.",
  });
});