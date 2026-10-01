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

export type BookDetails = {
  id: string;
  localId: string | null;
  title: string;
  authors: string[];
  categories: string[];
  coverUrl: string | null;
  description: string;
  googleBooksUrl: string;
  averageRating: number | null;
  reviewCount: number;
  reviews: BookCommunityReview[];
  vibes: string[];
  communityUnavailable?: boolean;
};

export type BookCommunityReview = {
  id: string;
  bookId: string;
  rating: number;
  text: string;
  createdAt: string;
  bookTitle?: string;
  bookAuthor?: string;
  bookCoverUrl?: string | null;
  externalId?: string;
};

export type CommunityBook = {
  id: string;
  externalId: string;
  title: string;
  author: string;
  coverUrl: string | null;
  averageRating: number;
  reviewCount: number;
};

export type CommunityFeed = {
  books: CommunityBook[];
  reviews: BookCommunityReview[];
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

export interface BookDetailsPort {
  getByExternalId(id: string): Promise<BookDetails>;
}
