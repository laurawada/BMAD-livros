"use server";

import { revalidatePath } from "next/cache";
import { createShelfServerService } from "@/infrastructure/supabase/shelf-service";
import { createShelfActionHandlers } from "@/server/shelf-action-handlers";
import type { ShelfActionState } from "@/server/shelf-action-handlers";

export type { ShelfActionState } from "@/server/shelf-action-handlers";

const handlers = createShelfActionHandlers({
  createService: createShelfServerService,
  revalidate: revalidatePath,
});

export async function addBookToShelf(
  signedSnapshot: string,
  _previousState: ShelfActionState,
  _formData: FormData,
): Promise<ShelfActionState> {
  void _previousState;
  void _formData;
  return handlers.addBook(signedSnapshot);
}

export async function changeShelfStatus(
  bookId: string,
  _previousState: ShelfActionState,
  formData: FormData,
): Promise<ShelfActionState> {
  void _previousState;
  return handlers.changeStatus(bookId, formData);
}