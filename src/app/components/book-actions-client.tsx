"use client";

import { useActionState } from "react";
import { createBookReview, type ReviewActionState } from "@/app/actions/book-actions";
import { ShelfActionClient } from "@/app/components/shelf-action-client";
import type { BookSnapshot } from "@/domain/shelf";
import styles from "./book-actions.module.css";

const initialState: ReviewActionState = { kind: "idle", message: "" };

export function BookActionsClient({
  signedSnapshot,
  snapshot,
}: {
  signedSnapshot: string;
  snapshot: BookSnapshot;
}) {
  const [state, action, pending] = useActionState(
    createBookReview.bind(null, snapshot.externalId, snapshot),
    initialState,
  );

  return (
    <section aria-label="Ações do livro" className={styles.actions}>
      <ShelfActionClient signedSnapshot={signedSnapshot} />
      <form action={action} className={styles.form}>
        <h2 className={styles.title}>Avaliar este livro</h2>
        <label className={styles.label} htmlFor="rating">Nota</label>
        <select className={styles.select} defaultValue="5" id="rating" name="rating">
          {[5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1].map((value) => <option key={value} value={value}>{value.toFixed(1)} estrelas</option>)}
        </select>
        <label className={styles.label} htmlFor="review-text">Sua resenha</label>
        <textarea className={styles.textarea} id="review-text" name="text" required minLength={1} rows={4} />
        <button className={styles.button} disabled={pending} type="submit">{pending ? "Salvando..." : "Publicar avaliação"}</button>
        <p aria-live="polite" className={styles.message}>{state.message}</p>
      </form>
    </section>
  );
}
