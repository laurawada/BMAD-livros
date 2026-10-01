"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { BookSearchPage } from "@/domain/books";
import styles from "./page.module.css";

type Field = "title" | "author";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [field, setField] = useState<Field>("title");
  const [result, setResult] = useState<BookSearchPage | null>(null);
  const [activeQuery, setActiveQuery] = useState("");
  const [activeField, setActiveField] = useState<Field>("title");
  const [page, setPage] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function search(term = activeQuery, searchField = activeField, targetPage = 0) {
    if (!term.trim()) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ query: term.trim(), field: searchField, page: String(targetPage) });
      const response = await fetch(`/api/books/search?${params}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Não foi possível pesquisar livros agora. Tente novamente.");
      setResult(data as BookSearchPage);
      setActiveQuery(term.trim());
      setActiveField(searchField);
      setPage(targetPage);
      setQuery(term.trim());
      setField(searchField);
    } catch {
      setResult(null);
      setError("Não foi possível pesquisar livros agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActiveQuery(query.trim());
    setActiveField(field);
    void search(query, field, 0);
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link className={styles.back} href="/">← Início</Link>
        <p className={styles.eyebrow}>Descubra sua próxima leitura</p>
        <h1>Buscar livros</h1>
        <p className={styles.lead}>Pesquise no catálogo do Google Books por título ou autor.</p>
        <form className={styles.form} onSubmit={submit}>
          <label className={styles.queryLabel} htmlFor="query">Termo de busca</label>
          <div className={styles.controls}>
            <input id="query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ex.: A hora da estrela" required maxLength={200} />
            <select aria-label="Pesquisar por" value={field} onChange={(event) => setField(event.target.value as Field)}>
              <option value="title">Título</option><option value="author">Autor</option>
            </select>
            <button type="submit" disabled={loading}>{loading ? "Buscando…" : "Buscar"}</button>
          </div>
        </form>

        {loading && <p className={styles.status} role="status">Buscando livros…</p>}
        {error && <section className={styles.message} role="alert"><p>{error}</p><button type="button" onClick={() => void search(query, field, 0)} disabled={loading}>Tentar novamente</button></section>}
        {result && result.items.length === 0 && <section className={styles.message}><h2>Nenhum livro encontrado</h2><p>Altere o termo ou escolha pesquisar por título ou autor.</p></section>}
        {result && result.items.length > 0 && <>
          <p className={styles.count}>Resultados por {activeField === "author" ? "autor" : "título"}: “{activeQuery}” · página {page + 1}</p>
          <ul className={styles.results}>
            {result.items.map((book) => <li className={styles.card} key={book.id}>
              {book.coverUrl ? <Image className={styles.cover} src={book.coverUrl} alt={`Capa de ${book.title}`} width={112} height={160} unoptimized /> : <div className={styles.coverPlaceholder} aria-label="Capa indisponível">Sem capa</div>}
              <div className={styles.bookInfo}><p className={styles.category}>{book.categories[0] ?? "Livro"}</p><h2><Link href={`/livro/${encodeURIComponent(book.id)}`}>{book.title}</Link></h2><p className={styles.author}>{book.authors.join(", ") || "Autor desconhecido"}</p>{typeof book.localAverageRating === "number" && <p>Média da comunidade: {book.localAverageRating.toFixed(1)}</p>}<p className={styles.attribution}>Dados bibliográficos fornecidos pelo Google</p><Link className={styles.googleLink} href={`/livro/${encodeURIComponent(book.id)}`}>Ver ficha do livro</Link>{book.googleBooksUrl && <> · <a className={styles.googleLink} href={book.googleBooksUrl} target="_blank" rel="noreferrer">Google Books ↗</a></>}</div>
            </li>)}
          </ul>
          {result.hasMore && <button className={styles.next} type="button" disabled={loading} onClick={() => void search(activeQuery, activeField, page + 1)}>{loading ? "Buscando…" : "Próxima página →"}</button>}
        </>}
      </div>
    </main>
  );
}
