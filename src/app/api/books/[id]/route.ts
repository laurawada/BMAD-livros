import { NextResponse } from "next/server";
import { GoogleBooksAdapter, GoogleBooksNotFoundError } from "@/infrastructure/google-books/google-books-adapter";
import { BookDetailsNotFoundError, getBookDetails } from "@/server/get-book-details";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id.trim() || id.length > 200) {
    return NextResponse.json({ error: "Este livro não foi encontrado." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const book = await getBookDetails(id, new GoogleBooksAdapter());
    return NextResponse.json(book, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BookDetailsNotFoundError || error instanceof GoogleBooksNotFoundError) {
      return NextResponse.json({ error: "Este livro não foi encontrado." }, { status: 404, headers: { "Cache-Control": "no-store" } });
    }
    console.error("Book details lookup failed", error);
    return NextResponse.json({ error: "Não foi possível carregar os detalhes deste livro agora. Tente novamente." }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
