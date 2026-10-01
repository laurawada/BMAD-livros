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

const service = loadTypeScript("src/server/search-books.ts");
const adapter = loadTypeScript("src/infrastructure/google-books/google-books-adapter.ts");
const route = loadTypeScript("src/app/api/books/search/route.ts", {
  "next/server": { NextResponse: { json: (body, init = {}) => new Response(JSON.stringify(body), { ...init, headers: { "content-type": "application/json", ...init.headers } }) } },
  "@/infrastructure/google-books/google-books-adapter": adapter,
  "@/server/search-books": service,
});

async function withProvider(fetchImpl, action, apiKey = "test-google-books-key") {
  const oldKey = process.env.GOOGLE_BOOKS_API_KEY;
  const oldFetch = globalThis.fetch;
  const oldLog = console.error;
  if (apiKey === null) delete process.env.GOOGLE_BOOKS_API_KEY;
  else process.env.GOOGLE_BOOKS_API_KEY = apiKey;
  globalThis.fetch = fetchImpl;
  console.error = () => {};
  try { return await action(); }
  finally {
    if (oldKey === undefined) delete process.env.GOOGLE_BOOKS_API_KEY;
    else process.env.GOOGLE_BOOKS_API_KEY = oldKey;
    globalThis.fetch = oldFetch;
    console.error = oldLog;
  }
}
function request({ query = "", field = "title", page = 0 } = {}) {
  const params = new URLSearchParams({ query, field, page: String(page) });
  return { nextUrl: new URL(`http://localhost/api/books/search?${params}`) };
}
const volume = (id, title, authors = []) => ({ id, volumeInfo: { title, authors, infoLink: `https://books.google.com/books?id=${id}` } });

test("busca por título preserva a ordem e calcula próxima página", async () => {
  let upstream;
  let options;
  const data = await withProvider(async (url, init) => {
    upstream = new URL(url); options = init;
    return Response.json({ totalItems: 3, items: [volume("b2", "Segundo"), volume("b1", "Primeiro")] });
  }, async () => {
    const response = await route.GET(request({ query: "  Duna  " }));
    assert.equal(response.status, 200);
    return response.json();
  });
  assert.equal(upstream.searchParams.get("q"), "intitle:Duna");
  assert.equal(upstream.searchParams.get("maxResults"), "20");
  assert.equal(upstream.searchParams.get("startIndex"), "0");
  assert.equal(upstream.searchParams.get("key"), "test-google-books-key");
  assert.ok(options.signal instanceof AbortSignal);
  assert.deepEqual(data.items.map((book) => book.id), ["b2", "b1"]);
  assert.equal(data.hasMore, true);
});

test("busca por autor pagina corretamente e não oferece outra página quando termina", async () => {
  let upstream;
  const data = await withProvider(async (url) => {
    upstream = new URL(url);
    return Response.json({ totalItems: 22, items: [volume("b21", "Livro 21"), volume("b22", "Livro 22")] });
  }, async () => {
    const response = await route.GET(request({ query: "Ada Lovelace", field: "author", page: 1 }));
    assert.equal(response.status, 200);
    return response.json();
  });
  assert.equal(upstream.searchParams.get("q"), "inauthor:Ada Lovelace");
  assert.equal(upstream.searchParams.get("maxResults"), "20");
  assert.equal(upstream.searchParams.get("startIndex"), "20");
  assert.equal(data.startIndex, 20);
  assert.equal(data.items.length, 2);
  assert.equal(data.hasMore, false);
});

test("busca sem resultados aceita total zero sem items", async () => {
  const data = await withProvider(async () => Response.json({ totalItems: 0 }), async () => {
    const response = await route.GET(request({ query: "livro inexistente" }));
    assert.equal(response.status, 200);
    return response.json();
  });
  assert.deepEqual(data.items, []);
  assert.equal(data.totalItems, 0);
  assert.equal(data.hasMore, false);
});

test("chave ausente retorna erro amigável sem chamar o Google Books", async () => {
  let calls = 0;
  const response = await withProvider(async () => { calls += 1; throw new Error("não deveria chamar"); }, async () => {
    const result = await route.GET(request({ query: "Duna" }));
    return { status: result.status, body: await result.json() };
  }, null);
  assert.equal(calls, 0);
  assert.equal(response.status, 502);
  assert.equal(response.body.error, "Não foi possível pesquisar livros agora. Tente novamente.");
});

test("quota ou falha do provedor retorna erro sem expor corpo interno", async () => {
  const response = await withProvider(async () => new Response("detalhe interno", { status: 429 }), async () => {
    const result = await route.GET(request({ query: "Duna" }));
    return { status: result.status, body: await result.json() };
  });
  assert.equal(response.status, 502);
  assert.equal(response.body.error, "Não foi possível pesquisar livros agora. Tente novamente.");
  assert.equal(JSON.stringify(response.body).includes("detalhe interno"), false);
});

test("resposta inválida do provedor vira erro, não resultado vazio", async () => {
  const response = await withProvider(async () => Response.json({ totalItems: 3 }), async () => {
    const result = await route.GET(request({ query: "Duna" }));
    return { status: result.status, body: await result.json() };
  });
  assert.equal(response.status, 502);
  assert.equal(response.body.error, "Não foi possível pesquisar livros agora. Tente novamente.");
});

test("paginação respeita página máxima", async () => {
  const data = await service.searchBooks({ query: "Duna", field: "title", page: 500 }, {
    async search() { return { items: [], totalItems: 10_001 }; },
  });
  assert.equal(data.startIndex, 10_000);
  assert.equal(data.hasMore, false);
  await assert.rejects(
    service.searchBooks({ query: "Duna", field: "title", page: 501 }, { async search() { throw new Error("não deveria chamar"); } }),
    service.InvalidBookSearchError,
  );
});
