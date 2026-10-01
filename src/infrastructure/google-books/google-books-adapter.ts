import type { BookSearchInput, BookSearchPort, BookSearchResult } from "@/domain/books";

const GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes";
const GOOGLE_BOOKS_TIMEOUT_MS = 10_000;
type GoogleBook = { id?: unknown; volumeInfo?: { title?: unknown; authors?: unknown; categories?: unknown; imageLinks?: { thumbnail?: unknown; smallThumbnail?: unknown }; infoLink?: unknown } };
type GoogleSearchResponse = { totalItems?: unknown; items?: unknown };

export class GoogleBooksAdapter implements BookSearchPort {
  async search(input: BookSearchInput): Promise<{ items: BookSearchResult[]; totalItems: number }> {
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    if (!apiKey) throw new Error("Google Books is not configured");
    const url = new URL(GOOGLE_BOOKS_API);
    url.searchParams.set("q", `${input.field === "title" ? "intitle" : "inauthor"}:${input.query}`);
    url.searchParams.set("maxResults", "20");
    url.searchParams.set("startIndex", String(input.page * 20));
    url.searchParams.set("key", apiKey);
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(GOOGLE_BOOKS_TIMEOUT_MS) });
    if (!response.ok) throw new Error(`Google Books returned ${response.status}`);
    const payload: GoogleSearchResponse = await response.json();
    if (!payload || typeof payload !== "object") throw new Error("Google Books returned an invalid response");
    const totalItems = payload.totalItems;
    const rawItems = payload.items;
    if (typeof totalItems !== "number" || !Number.isSafeInteger(totalItems) || totalItems < 0) throw new Error("Google Books returned an invalid response");
    if (rawItems !== undefined && !Array.isArray(rawItems)) throw new Error("Google Books returned an invalid response");
    if (totalItems > 0 && !Array.isArray(rawItems)) throw new Error("Google Books returned an invalid response");
    const items = ((rawItems ?? []) as GoogleBook[]).flatMap((book) => {
      const info = book?.volumeInfo;
      if (typeof book?.id !== "string" || typeof info?.title !== "string") return [];
      const thumbnail = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail;
      return [{
        id: book.id,
        title: info.title,
        authors: Array.isArray(info.authors) ? info.authors.filter((item): item is string => typeof item === "string") : [],
        categories: Array.isArray(info.categories) ? info.categories.filter((item): item is string => typeof item === "string") : [],
        coverUrl: typeof thumbnail === "string" ? thumbnail.replace(/^http:/, "https:") : null,
        googleBooksUrl: typeof info.infoLink === "string" ? info.infoLink : `https://books.google.com/books?id=${encodeURIComponent(book.id)}`,
      }];
    });
    return { items, totalItems };
  }
}
