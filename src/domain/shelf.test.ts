import assert from "node:assert/strict";
import test from "node:test";
import {
  groupShelfEntries,
  isBookSnapshot,
  isShelfStatus,
  SHELF_STATUSES,
} from "./shelf";

test("accepts only the four shelf statuses", () => {
  assert.deepEqual(SHELF_STATUSES, ["Quero ler", "Lendo", "Lido", "Abandonei"]);
  assert.equal(isShelfStatus("Lendo"), true);
  assert.equal(isShelfStatus("Removido"), false);
  assert.equal(isShelfStatus(null), false);
});

test("validates the required book snapshot without requiring optional metadata", () => {
  assert.equal(
    isBookSnapshot({ externalId: "google-1", title: "Book", author: "Author" }),
    true,
  );
  assert.equal(isBookSnapshot({ externalId: "google-1", title: "Book" }), false);
  assert.equal(
    isBookSnapshot({ externalId: "google-1", title: "x".repeat(501), author: "Author" }),
    false,
  );
  assert.equal(
    isBookSnapshot({ externalId: " ", title: "Book", author: "Author" }),
    false,
  );
});

test("groups entries into all four shelf statuses, including empty groups", () => {
  const groups = groupShelfEntries([
    {
      id: "shelf-1",
      bookId: "book-1",
      status: "Lido",
      updatedAt: "2026-10-01T10:00:00.000Z",
      book: { externalId: "google-1", title: "Book", author: "Author" },
    },
  ]);

  assert.deepEqual(Object.keys(groups), SHELF_STATUSES);
  assert.equal(groups.Lido.length, 1);
  assert.equal(groups["Quero ler"].length, 0);
  assert.equal(groups.Lendo.length, 0);
  assert.equal(groups.Abandonei.length, 0);
});