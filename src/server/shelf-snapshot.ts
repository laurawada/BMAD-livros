import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

import { isBookSnapshot } from "@/domain/shelf";
import type { BookSnapshot } from "@/domain/shelf";

export type VerifiedBookSnapshot = {
  snapshot: BookSnapshot;
  payload: string;
  signature: string;
};

function getSigningSecret(): string {
  const secret = process.env.SHELF_SNAPSHOT_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error("SHELF_SNAPSHOT_SECRET must contain at least 32 bytes.");
  }
  return secret;
}

export function signBookSnapshot(snapshot: BookSnapshot): string {
  if (!isBookSnapshot(snapshot)) throw new Error("Invalid book snapshot.");

  const payload = JSON.stringify({
    externalId: snapshot.externalId,
    title: snapshot.title,
    author: snapshot.author,
    coverUrl: snapshot.coverUrl ?? null,
    genre: snapshot.genre ?? null,
    description: snapshot.description ?? null,
  });
  const signature = createHmac("sha256", getSigningSecret())
    .update(payload)
    .digest("hex");

  return `${Buffer.from(payload).toString("base64url")}.${signature}`;
}

export function verifyBookSnapshot(token: unknown): VerifiedBookSnapshot | null {
  if (typeof token !== "string") return null;

  const [encodedPayload, signature, extra] = token.split(".");
  if (
    !encodedPayload ||
    !signature ||
    !/^[0-9a-f]{64}$/.test(signature) ||
    extra !== undefined
  ) {
    return null;
  }

  try {
    const payload = Buffer.from(encodedPayload, "base64url").toString("utf8");
    const expected = createHmac("sha256", getSigningSecret())
      .update(payload)
      .digest();
    const received = Buffer.from(signature, "hex");
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
      return null;
    }

    const parsed: unknown = JSON.parse(payload);
    if (!isBookSnapshot(parsed)) return null;

    const snapshot: BookSnapshot = {
      externalId: parsed.externalId,
      title: parsed.title,
      author: parsed.author,
      coverUrl: parsed.coverUrl ?? null,
      genre: parsed.genre ?? null,
      description: parsed.description ?? null,
    };
    const canonicalPayload = JSON.stringify(snapshot);
    if (canonicalPayload !== payload) return null;

    return { snapshot, payload, signature };
  } catch {
    return null;
  }
}