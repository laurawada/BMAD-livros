export const SHELF_STATUSES = [
  "Quero ler",
  "Lendo",
  "Lido",
  "Abandonei",
] as const;

export type ShelfStatus = (typeof SHELF_STATUSES)[number];

export const SHELF_STATUS_FORM_FIELD = "status";

export interface BookSnapshot {
  externalId: string;
  title: string;
  author: string;
  coverUrl?: string | null;
  genre?: string | null;
  description?: string | null;
}

export interface ShelfEntry {
  id: string;
  bookId: string;
  status: ShelfStatus;
  updatedAt: string;
  book: BookSnapshot;
}

export type ShelfGroups = Record<ShelfStatus, ShelfEntry[]>;

export function isShelfStatus(value: unknown): value is ShelfStatus {
  return typeof value === "string" && SHELF_STATUSES.includes(value as ShelfStatus);
}

export function isBookSnapshot(value: unknown): value is BookSnapshot {
  if (typeof value !== "object" || value === null) return false;

  const snapshot = value as Record<string, unknown>;
  return (
    typeof snapshot.externalId === "string" &&
    snapshot.externalId.trim().length > 0 &&
    snapshot.externalId.length <= 255 &&
    typeof snapshot.title === "string" &&
    snapshot.title.trim().length > 0 &&
    snapshot.title.length <= 500 &&
    typeof snapshot.author === "string" &&
    snapshot.author.trim().length > 0 &&
    snapshot.author.length <= 1000 &&
    isOptionalText(snapshot.coverUrl, 2048) &&
    isOptionalText(snapshot.genre, 255) &&
    isOptionalText(snapshot.description, 10000)
  );
}

function isOptionalText(value: unknown, maxLength: number): boolean {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.length <= maxLength)
  );
}

export function groupShelfEntries(entries: ShelfEntry[]): ShelfGroups {
  const groups: ShelfGroups = {
    "Quero ler": [],
    Lendo: [],
    Lido: [],
    Abandonei: [],
  };

  for (const entry of entries) groups[entry.status].push(entry);
  return groups;
}