import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Module from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import ts from "typescript";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadTypeScript(relativePath, aliases = {}) {
  const filename = path.join(projectRoot, relativePath);
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  const loaded = new Module(filename);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalRequire = loaded.require.bind(loaded);
  loaded.require = (specifier) => aliases[specifier] ?? originalRequire(specifier);
  loaded._compile(outputText, filename);
  return loaded.exports;
}

let localBook = null;
let externalBook = null;
let community = { averageRating: 4.5, reviewCount: 2, reviews: [{ id: "review-1" }], vibes: ["aconchegante"] };
let supabaseConfigured = true;
let communityFailure = false;
let localLookups = 0;

const storage = {
  findBookByLocalId: async () => { localLookups += 1; return localBook; },
  findBookByExternalId: async () => externalBook,
  isSupabaseConfigured: () => supabaseConfigured,
  readBookCommunity: async () => {
    if (communityFailure) throw new Error("Database unavailable");
    return community;
  },
  storedBook: (book) => ({
    id: book.id,
    title: book.title,
    authors: [book.author],
    categories: book.genre ? [book.genre] : [],
    coverUrl: book.cover_url,
    description: book.description ?? "",
    googleBooksUrl: `https://books.google.com/books?id=${book.external_id}`,
  }),
};

const service = loadTypeScript("src/server/get-book-details.ts", {
  "@/infrastructure/supabase/book-discovery-adapter": storage,
});

const stored = {
  id: "8f1d4a2a-b437-4e10-9000-1d6ad0c9b013",
  external_id: "google-volume-1",
  title: "Snapshot local",
  author: "Autora Local",
  cover_url: "https://example.com/cover.jpg",
  genre: "Fantasia",
  description: "Descrição salva",
};

function googleDetails(overrides = {}) {
  return {
    id: "google-volume-2",
    localId: null,
    title: "Livro externo",
    authors: ["Autora Google"],
    categories: ["Ficção"],
    coverUrl: null,
    description: "Descrição Google",
    googleBooksUrl: "https://books.google.com/books?id=google-volume-2",
    averageRating: null,
    reviewCount: 0,
    reviews: [],
    vibes: [],
    ...overrides,
  };
}

function reset() {
  localBook = null;
  externalBook = null;
  community = { averageRating: 4.5, reviewCount: 2, reviews: [{ id: "review-1" }], vibes: ["aconchegante"] };
  supabaseConfigured = true;
  communityFailure = false;
  localLookups = 0;
}

async function withoutExpectedLogs(action) {
  const oldError = console.error;
  const oldWarn = console.warn;
  console.error = () => {};
  console.warn = () => {};
  try { return await action(); }
  finally {
    console.error = oldError;
    console.warn = oldWarn;
  }
}

test("volume externo não adotado consulta o provedor sem gravar ou buscar comunidade", async () => {
  reset();
  const requested = [];
  const result = await service.getBookDetails("google-volume-2", {
    getByExternalId: async (id) => { requested.push(id); return googleDetails(); },
  });
  assert.deepEqual(requested, ["google-volume-2"]);
  assert.equal(result.localId, null);
  assert.equal(result.communityUnavailable, false);
  assert.equal(localLookups, 0);
});

test("UUID local carrega snapshot e conteúdo comunitário sem depender do Google", async () => {
  reset();
  localBook = stored;
  let providerCalls = 0;
  const result = await service.getBookDetails(stored.id, {
    getByExternalId: async () => { providerCalls += 1; return googleDetails(); },
  });
  assert.equal(providerCalls, 0);
  assert.equal(result.localId, stored.id);
  assert.equal(result.id, stored.external_id);
  assert.equal(result.title, stored.title);
  assert.equal(result.averageRating, 4.5);
  assert.equal(result.reviewCount, 2);
  assert.deepEqual(result.vibes, ["aconchegante"]);
  assert.equal(result.reviews.length, 1);
});

test("falha Google usa snapshot local e preserva dados da comunidade", async () => {
  reset();
  externalBook = stored;
  const result = await withoutExpectedLogs(() => service.getBookDetails(stored.external_id, {
    getByExternalId: async () => { throw new Error("provider offline"); },
  }));
  assert.equal(result.title, stored.title);
  assert.equal(result.description, stored.description);
  assert.equal(result.averageRating, 4.5);
  assert.equal(result.communityUnavailable, false);
});

test("falha Google sem snapshot retorna erro ao chamador", async () => {
  reset();
  await assert.rejects(service.getBookDetails("missing-volume", {
    getByExternalId: async () => { throw new Error("provider offline"); },
  }), /provider offline/);
});

test("falha na leitura comunitária não derruba os metadados do livro", async () => {
  reset();
  localBook = stored;
  communityFailure = true;
  const result = await withoutExpectedLogs(() => service.getBookDetails(stored.id, {
    getByExternalId: async () => googleDetails(),
  }));
  assert.equal(result.title, stored.title);
  assert.equal(result.communityUnavailable, true);
  assert.deepEqual(result.reviews, []);
});

test("ID local sem snapshot retorna não encontrado sem chamar o provedor", async () => {
  reset();
  let providerCalls = 0;
  await assert.rejects(service.getBookDetails("8f1d4a2a-b437-4e10-9000-1d6ad0c9b013", {
    getByExternalId: async () => { providerCalls += 1; return googleDetails(); },
  }), (error) => error instanceof service.BookDetailsNotFoundError);
  assert.equal(providerCalls, 0);
});
