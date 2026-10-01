export type BookSearchField = "title" | "author";

export type BookSearchInput = {
  query: string;
  field: BookSearchField;
  page: number;
};

export type BookSearchResult = {
  id: string;
  title: string;
  authors: string[];
  categories: string[];
  coverUrl: string | null;
  googleBooksUrl: string | null;
  localAverageRating?: number;
};

export type BookSearchPage = {
  items: BookSearchResult[];
  totalItems: number;
  startIndex: number;
  hasMore: boolean;
};

export interface BookSearchPort {
  search(input: BookSearchInput): Promise<{ items: BookSearchResult[]; totalItems: number }>;
}
