import assert from "node:assert/strict";
import test from "node:test";

import { signBookSnapshot, verifyBookSnapshot } from "./shelf-snapshot";

test("verifies server-signed provider snapshots and rejects tampering", () => {
  const originalSecret = process.env.SHELF_SNAPSHOT_SECRET;
  process.env.SHELF_SNAPSHOT_SECRET = "test-secret-with-at-least-32-bytes";

  try {
    const snapshot = {
      externalId: "google-1",
      title: "Book",
      author: "Author",
    };
    const token = signBookSnapshot(snapshot);
    const [payload, signature] = token.split(".");
    const forgedPayload = Buffer.from(
      JSON.stringify({ ...snapshot, title: "Forged title" }),
    ).toString("base64url");

    const verified = verifyBookSnapshot(token);
    assert.deepEqual(verified?.snapshot, {
      ...snapshot,
      coverUrl: null,
      genre: null,
      description: null,
    });
    assert.equal(verifyBookSnapshot(`${forgedPayload}.${signature}`), null);
    assert.equal(verifyBookSnapshot(`${payload}.${signature}x`), null);
  } finally {
    if (originalSecret === undefined) delete process.env.SHELF_SNAPSHOT_SECRET;
    else process.env.SHELF_SNAPSHOT_SECRET = originalSecret;
  }
});