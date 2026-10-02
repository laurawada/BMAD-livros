import type { BookSnapshot } from "@/domain/shelf";
import { signBookSnapshot } from "@/server/shelf-snapshot";
import { ShelfActionClient } from "./shelf-action-client";

export async function ShelfAction({ snapshot }: { snapshot: BookSnapshot }) {
  const signedSnapshot = signBookSnapshot(snapshot);
  return <ShelfActionClient signedSnapshot={signedSnapshot} />;
}