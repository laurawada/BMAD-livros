import { NextResponse } from "next/server";
import { isSupabaseConfigured, readCommunityFeed } from "@/infrastructure/supabase/book-discovery-adapter";

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ books: [], reviews: [] }, { headers: { "Cache-Control": "no-store" } });
    }
    const feed = await readCommunityFeed();
    return NextResponse.json(feed, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Community feed failed", error);
    return NextResponse.json({ error: "Não foi possível carregar as novidades da comunidade agora." }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
