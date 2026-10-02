import "server-only";
import { ShelfUseCaseError } from "@/server/shelf";

export function redirectUnauthenticatedShelf(
  error: unknown,
  redirectTo: (path: string) => never,
): boolean {
  if (
    error instanceof ShelfUseCaseError &&
    error.code === "UNAUTHENTICATED"
  ) {
    redirectTo("/login");
    return true;
  }

  return false;
}