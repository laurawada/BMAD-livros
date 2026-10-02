"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { BookDetails } from "@/domain/books";
import styles from "./page.module.css";

export default function BookDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<BookDetails | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function loadBook() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/books/${encodeURIComponent(id)}`, { cache: "no-store", signal: controller.signal });
        const payload = await response.json();
        if (!response.ok || !payload || typeof payload.title !== "string" || !Array.isArray(payload.authors) || !Array.isArray(payload.categories) || !Array.isArray(payload.reviews) || !Array.isArray(payload.vibes)) {
          throw new Error(response.ok ? "Resposta inválida" : typeof payload?.error === "string" ? payload.error : "Não foi possível carregar os detalhes deste livro agora.");
        }
        setBook(payload as BookDetails);
      } catch (cause) {
        if (controller.signal.aborted) return;
        setBook(null);
        setError(cause instanceof Error && cause.message.startsWith("Este livro não foi encontrado")
          ? cause.message
          : "Não foi possível carregar os detalhes deste livro agora. Tente novamente.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadBook();
    return () => controller.abort();
  }, [id]);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link className={styles.back} href="/buscar">← Voltar para a busca</Link>
        {loading && <p className={styles.status} role="status">Carregando ficha do livro…</p>}
        {error && <section className={styles.message} role="alert"><h1>Não foi possível abrir a ficha</h1><p>{error}</p><Link href="/buscar">Voltar para a busca</Link></section>}
        {book && <article className={styles.card}>
          <div className={styles.coverArea}>
            {book.coverUrl ? <Image className={styles.cover} src={book.coverUrl} alt={`Capa de ${book.title}`} width={240} height={340} unoptimized /> : <div className={styles.coverPlaceholder}>Capa indisponível</div>}
          </div>
          <div className={styles.details}>
            <p className={styles.eyebrow}>{book.categories[0] ?? "Livro"}</p>
            <h1>{book.title}</h1>
            <p className={styles.author}>{book.authors.join(", ") || "Autor desconhecido"}</p>
            <p className={styles.attribution}>Dados bibliográficos fornecidos pelo Google Books</p>
            {book.averageRating !== null && book.reviewCount > 0 && <p className={styles.rating}>★ {book.averageRating.toFixed(1)} <span>· {book.reviewCount} {book.reviewCount === 1 ? "avaliação" : "avaliações"} da comunidade</span></p>}
            {book.communityUnavailable && <p className={styles.communityNotice}>As avaliações da comunidade estão temporariamente indisponíveis.</p>}
            <section className={styles.description}>
              <h2>Sobre o livro</h2>
              {book.description ? <p>{book.description}</p> : <p>Descrição indisponível.</p>}
            </section>
            {book.vibes.length > 0 && <section className={styles.vibes} aria-label="Vibes da comunidade">{book.vibes.map((vibe) => <span key={vibe}>{vibe}</span>)}</section>}
            {book.reviews.length > 0 && <section className={styles.reviews}>
              <h2>Resenhas da comunidade</h2>
              <ul>{book.reviews.map((review) => <li key={review.id}><p className={styles.reviewRating}>★ {review.rating.toFixed(1)}</p><p>{review.text}</p><time dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleDateString("pt-BR")}</time></li>)}</ul>
            </section>}
            <a className={styles.googleLink} href={book.googleBooksUrl} target="_blank" rel="noreferrer">Ver no Google Books ↗</a>
          </div>
        </article>}
      </div>
    </main>
  );
}
