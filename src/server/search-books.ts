import type { BookSearchInput, BookSearchPage, BookSearchPort } from "@/domain/books";

export class InvalidBookSearchError extends Error {}

export async function searchBooks(input: BookSearchInput, port: BookSearchPort): Promise<BookSearchPage> {
  const query = input.query.trim();
  if (!query || query.length > 200) throw new InvalidBookSearchError("Invalid search query");
  if (input.field !== "title" && input.field !== "author") throw new InvalidBookSearchError("Invalid search field");
  if (!Number.isInteger(input.page) || input.page < 0 || input.page > 500) throw new InvalidBookSearchError("Invalid page");

  const normalizedInput = { ...input, query };
  const { items, totalItems } = await port.search(normalizedInput);
  const startIndex = input.page * 20;
  return { items, totalItems, startIndex, hasMore: input.page < 500 && totalItems > startIndex + items.length };
}
