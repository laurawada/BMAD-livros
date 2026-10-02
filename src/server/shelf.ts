import "server-only";
import { isBookSnapshot, isShelfStatus } from "@/domain/shelf";
import type { ShelfRepository } from "@/domain/ports/shelf-repository";

export type ShelfUser = { id: string };

export interface ShelfAuth {
  getUser(): Promise<ShelfUser | null>;
}

export type ShelfErrorCode =
  | "UNAUTHENTICATED"
  | "INVALID_BOOK"
  | "INVALID_STATUS"
  | "NOT_FOUND";

const errorMessages: Record<ShelfErrorCode, string> = {
  UNAUTHENTICATED: "Entre na sua conta para acessar a estante.",
  INVALID_BOOK: "Os dados deste livro são inválidos.",
  INVALID_STATUS: "Selecione um status válido.",
  NOT_FOUND: "Este livro não está na sua estante.",
};

export class ShelfUseCaseError extends Error {
  constructor(readonly code: ShelfErrorCode) {
    super(errorMessages[code]);
    this.name = "ShelfUseCaseError";
  }
}

export function createShelfService(
  auth: ShelfAuth,
  repository: ShelfRepository,
) {
  async function requireUserId(): Promise<string> {
    const user = await auth.getUser();
    if (!user?.id) throw new ShelfUseCaseError("UNAUTHENTICATED");
    return user.id;
  }

  return {
    getAuthenticatedUser: () => auth.getUser(),

    async addBook(
      snapshot: unknown,
      signedPayload: string,
      signature: string,
    ) {
      if (!isBookSnapshot(snapshot)) throw new ShelfUseCaseError("INVALID_BOOK");
      return repository.addBookToShelf(
        await requireUserId(),
        snapshot,
        signedPayload,
        signature,
      );
    },

    async changeStatus(bookId: string, status: unknown) {
      if (!isShelfStatus(status)) throw new ShelfUseCaseError("INVALID_STATUS");
      const entry = await repository.changeShelfStatus(
        await requireUserId(),
        bookId,
        status,
      );
      if (!entry) throw new ShelfUseCaseError("NOT_FOUND");
      return entry;
    },

    async getShelf() {
      return repository.getShelf(await requireUserId());
    },
  };
}