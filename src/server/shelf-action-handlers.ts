import "server-only";
import { SHELF_STATUS_FORM_FIELD } from "@/domain/shelf";
import { verifyBookSnapshot } from "@/server/shelf-snapshot";
import { ShelfUseCaseError } from "@/server/shelf";
import type { createShelfService } from "@/server/shelf";

export interface ShelfActionState {
  kind: "idle" | "success" | "error";
  message: string;
}

type ShelfActionService = Pick<
  ReturnType<typeof createShelfService>,
  "addBook" | "changeStatus"
>;

export function createShelfActionHandlers(dependencies: {
  createService(): Promise<ShelfActionService>;
  revalidate(path: string): void;
}) {
  const failure: ShelfActionState = {
    kind: "error",
    message: "Não foi possível atualizar sua estante. Tente novamente.",
  };

  function getSafeError(error: unknown): ShelfActionState {
    if (error instanceof ShelfUseCaseError) {
      return { kind: "error", message: error.message };
    }

    console.error("Shelf action failed.", error);
    return failure;
  }

  return {
    async addBook(signedSnapshot: string): Promise<ShelfActionState> {
      try {
        const verifiedSnapshot = verifyBookSnapshot(signedSnapshot);
        if (!verifiedSnapshot) throw new ShelfUseCaseError("INVALID_BOOK");

        const service = await dependencies.createService();
        await service.addBook(
          verifiedSnapshot.snapshot,
          verifiedSnapshot.payload,
          verifiedSnapshot.signature,
        );
        dependencies.revalidate("/estante");
        return { kind: "success", message: "Livro adicionado à estante." };
      } catch (error) {
        return getSafeError(error);
      }
    },

    async changeStatus(
      bookId: string,
      formData: FormData,
    ): Promise<ShelfActionState> {
      try {
        const service = await dependencies.createService();
        await service.changeStatus(bookId, formData.get(SHELF_STATUS_FORM_FIELD));
        dependencies.revalidate("/estante");
        return { kind: "success", message: "Status atualizado." };
      } catch (error) {
        return getSafeError(error);
      }
    },
  };
}