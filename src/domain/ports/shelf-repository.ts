import type { BookSnapshot, ShelfEntry, ShelfStatus } from "../shelf";

export interface ShelfRepository {
  addBookToShelf(
    userId: string,
    snapshot: BookSnapshot,
    signedPayload: string,
    signature: string,
  ): Promise<ShelfEntry>;
  changeShelfStatus(
    userId: string,
    bookId: string,
    status: ShelfStatus,
  ): Promise<ShelfEntry | null>;
  getShelf(userId: string): Promise<ShelfEntry[]>;
}