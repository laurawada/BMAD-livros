import assert from "node:assert/strict";
import test from "node:test";

import { SHELF_STATUS_FORM_FIELD } from "@/domain/shelf";
import { signBookSnapshot } from "@/server/shelf-snapshot";
import { createShelfActionHandlers } from "./shelf-action-handlers";

test("passes the submitted status through the action handler and revalidates shelf", async () => {
  const originalSecret = process.env.SHELF_SNAPSHOT_SECRET;
  process.env.SHELF_SNAPSHOT_SECRET = "test-secret-with-at-least-32-bytes";
  const calls: unknown[][] = [];
  const handlers = createShelfActionHandlers({
    async createService() {
      return {
        async addBook(snapshot, payload, signature) {
          calls.push(["add", snapshot, payload, signature]);
        },
        async changeStatus(bookId, status) {
          calls.push(["change", bookId, status]);
        },
      };
    },
    revalidate(path) {
      calls.push(["revalidate", path]);
    },
  });

  try {
    const snapshot = {
      externalId: "google-1",
      title: "Book",
      author: "Author",
    };
    const signedSnapshot = signBookSnapshot(snapshot);
    const [encodedPayload, signature] = signedSnapshot.split(".");
    const payload = Buffer.from(encodedPayload, "base64url").toString("utf8");
    const addResult = await handlers.addBook(signedSnapshot);
    const formData = new FormData();
    formData.set(SHELF_STATUS_FORM_FIELD, "Lido");
    const changeResult = await handlers.changeStatus("book-1", formData);

    assert.equal(addResult.kind, "success");
    assert.equal(changeResult.kind, "success");
    assert.deepEqual(calls, [
      [
        "add",
        { ...snapshot, coverUrl: null, genre: null, description: null },
        payload,
        signature,
      ],
      ["revalidate", "/estante"],
      ["change", "book-1", "Lido"],
      ["revalidate", "/estante"],
    ]);
  } finally {
    if (originalSecret === undefined) delete process.env.SHELF_SNAPSHOT_SECRET;
    else process.env.SHELF_SNAPSHOT_SECRET = originalSecret;
  }
});