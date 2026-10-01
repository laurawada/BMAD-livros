import { NextRequest, NextResponse } from "next/server";
import { GoogleBooksAdapter } from "@/infrastructure/google-books/google-books-adapter";
import { InvalidBookSearchError, searchBooks } from "@/server/search-books";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const rawPage = params.get("page") ?? "0";
  const page = /^\d+$/.test(rawPage) ? Number(rawPage) : Number.NaN;
  const field = params.get("field");

  try {
    if (field !== "title" && field !== "author") throw new InvalidBookSearchError("Invalid search field");
    const result = await searchBooks({ query: params.get("query") ?? "", field, page }, new GoogleBooksAdapter());
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof InvalidBookSearchError) {
      return NextResponse.json({ error: "Confira o termo, o campo e a página da busca." }, { status: 400 });
    }
    console.error("Book search failed", error);
    return NextResponse.json({ error: "Não foi possível pesquisar livros agora. Tente novamente." }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
