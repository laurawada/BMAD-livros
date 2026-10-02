"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CommunityFeed } from "@/domain/books";
import styles from "./page.module.css";

async function requestFeed(): Promise<CommunityFeed> {
  const response = await fetch("/api/books/community", { cache: "no-store" });
  const payload = await response.json();
  if (!response.ok || !payload || !Array.isArray(payload.books) || !Array.isArray(payload.reviews)) throw new Error("feed unavailable");
  return payload as CommunityFeed;
}

export default function HomeCommunity() {
  const [feed, setFeed] = useState<CommunityFeed>({ books: [], reviews: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    requestFeed().then((nextFeed) => {
      if (active) setFeed(nextFeed);
    }).catch(() => {
      if (active) setError("Não foi possível carregar as novidades da comunidade agora.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  async function retryFeed() {
    setLoading(true);
    setError("");
    try {
      setFeed(await requestFeed());
    } catch {
      setError("Não foi possível carregar as novidades da comunidade agora.");
    } finally {
      setLoading(false);
    }
  }

  return <>
    <section className={styles.community} aria-labelledby="recent-books-title">
      <div className={styles.sectionHeading}>
        <div><p className={styles.eyebrow}>Da comunidade</p><h2 id="recent-books-title">Leituras recentes</h2></div>
      </div>
      {loading && <p className={styles.feedStatus} role="status">Carregando leituras…</p>}
      {error && <div className={styles.feedMessage} role="alert"><p>{error}</p><button type="button" onClick={() => void retryFeed()} disabled={loading}>Tentar novamente</button></div>}
      {!loading && !error && feed.books.length === 0 && <div className={styles.emptyState}>
        <span className={styles.emptyIcon} aria-hidden="true">✦</span>
        <h3>As primeiras leituras estão por vir</h3>
        <p>Quando a comunidade começar a avaliar livros, eles vão aparecer aqui.</p>
        <Link href="/buscar">Explore o catálogo enquanto isso <span aria-hidden="true">→</span></Link>
      </div>}
      {!loading && !error && feed.books.length > 0 && <ul className={styles.bookGrid}>
        {feed.books.map((book) => <li className={styles.bookCard} key={book.id}>
          <Link className={styles.bookCardLink} href={`/livro/${encodeURIComponent(book.id)}`}>
            {book.coverUrl ? <Image className={styles.feedCover} src={book.coverUrl} alt={`Capa de ${book.title}`} width={145} height={205} unoptimized /> : <span className={styles.feedCoverPlaceholder}>Sem capa</span>}
            <span className={styles.feedBookTitle}>{book.title}</span>
          </Link>
          <span className={styles.feedBookAuthor}>{book.author}</span>
          <span className={styles.feedRating} aria-label={`Média ${book.averageRating.toFixed(1)} de 5`}>★ {book.averageRating.toFixed(1)} <small>({book.reviewCount})</small></span>
        </li>)}
      </ul>}
    </section>

    <section className={styles.community} aria-labelledby="recent-reviews-title">
      <div className={styles.sectionHeading}>
        <div><p className={styles.eyebrow}>Opiniões de leitores</p><h2 id="recent-reviews-title">Resenhas recentes</h2></div>
      </div>
      {loading && <p className={styles.feedStatus} role="status">Carregando resenhas…</p>}
      {error && <p className={styles.feedMuted}>As resenhas estão temporariamente indisponíveis.</p>}
      {!loading && !error && feed.reviews.length === 0 && <div className={styles.reviewEmpty}>
        <p>As resenhas da comunidade vão aparecer aqui assim que forem publicadas.</p>
        <Link href="/buscar">Encontre um livro para começar <span aria-hidden="true">→</span></Link>
      </div>}
      {!loading && !error && feed.reviews.length > 0 && <ul className={styles.reviewList}>
        {feed.reviews.map((review) => <li className={styles.reviewCard} key={review.id}>
          <div className={styles.reviewMeta}><span>★ {review.rating.toFixed(1)}</span><span>{new Date(review.createdAt).toLocaleDateString("pt-BR")}</span></div>
          <p className={styles.reviewText}>“{review.text}”</p>
          <Link href={`/livro/${encodeURIComponent(review.bookId)}`}>{review.bookTitle ?? "Ver livro"} · {review.bookAuthor ?? "Autor desconhecido"} <span aria-hidden="true">→</span></Link>
        </li>)}
      </ul>}
    </section>
  </>;
}
