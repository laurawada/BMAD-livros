"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signBookSnapshot } from "@/server/shelf-snapshot";
import type { BookSnapshot } from "@/domain/shelf";

export async function signBookForShelf(snapshot: BookSnapshot) {
  return signBookSnapshot(snapshot);
}

export type ReviewActionState = { kind: "idle" | "success" | "error"; message: string };

export async function createBookReview(
  externalId: string,
  snapshot: BookSnapshot,
  _previousState: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const rating = Number(formData.get("rating"));
  const text = String(formData.get("text") ?? "").trim();
  if (!Number.isFinite(rating) || rating < 1 || rating > 5 || rating * 2 !== Math.round(rating * 2) || !text) {
    return { kind: "error", message: "Informe uma nota de meia em meia estrela e uma resenha." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) return { kind: "error", message: "Entre na sua conta para avaliar este livro." };

    const signedSnapshot = signBookSnapshot(snapshot);
    const [encodedPayload, signature] = signedSnapshot.split(".");
    const payload = Buffer.from(encodedPayload, "base64url").toString("utf8");
    const { error: shelfError } = await supabase.rpc("add_book_to_shelf", {
      p_external_id: snapshot.externalId,
      p_title: snapshot.title,
      p_author: snapshot.author,
      p_snapshot_payload: payload,
      p_snapshot_signature: signature,
      p_cover_url: snapshot.coverUrl,
      p_genre: snapshot.genre,
      p_description: snapshot.description,
    });
    if (shelfError) throw shelfError;

    const { data: book, error: bookError } = await supabase.from("books").select("id").eq("external_id", externalId).single();
    if (bookError || !book) throw bookError ?? new Error("Livro não encontrado");
    const { error: reviewError } = await supabase.from("reviews").upsert(
      { user_id: authData.user.id, book_id: book.id, rating, text },
      { onConflict: "user_id,book_id" },
    );
    if (reviewError) throw reviewError;
    revalidatePath(`/livro/${externalId}`);
    revalidatePath(`/perfil/${authData.user.id}`);
    return { kind: "success", message: "Avaliação salva com sucesso." };
  } catch (error) {
    console.error("Book review creation failed.", error);
    return { kind: "error", message: "Não foi possível salvar sua avaliação agora." };
  }
}
