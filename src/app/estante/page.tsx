import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  groupShelfEntries,
  SHELF_STATUSES,
  type ShelfStatus,
} from "@/domain/shelf";
import type { ShelfEntry } from "@/domain/shelf";
import { redirectUnauthenticatedShelf } from "@/server/shelf-page-auth";
import { createShelfServerService } from "@/infrastructure/supabase/shelf-service";
import { ShelfStatusAction } from "@/app/components/shelf-action-client";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function ShelfPage() {
  let service;
  try {
    service = await createShelfServerService();
  } catch {
    return <ShelfError />;
  }

  let entries: ShelfEntry[] = [];
  let hasError = false;
  try {
    entries = await service.getShelf();
  } catch (error) {
    hasError = !redirectUnauthenticatedShelf(error, redirect);
  }

  if (hasError) return <ShelfError />;
  const groups = groupShelfEntries(entries);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.wordmark} href="/">
          Letterboxd de Livros
        </Link>
        <span>ESTANTE PESSOAL</span>
      </header>

      <section className={styles.intro}>
        <p className={styles.eyebrow}>SEU ACERVO</p>
        <h1>Minha estante</h1>
        <p>Livros guardados, em cada etapa da leitura.</p>
      </section>

      <div className={styles.groups}>
        {SHELF_STATUSES.map((status) => {
          const books = groups[status];
          return (
            <section aria-labelledby={`group-${status}`} className={styles.group} key={status}>
              <div className={styles.groupHeading}>
                <h2 id={`group-${status}`}>{status}</h2>
                <span>{books.length.toString().padStart(2, "0")}</span>
              </div>
              {books.length ? (
                <ul className={styles.bookList}>
                  {books.map((entry) => (
                    <ShelfBook entry={entry} key={entry.id} status={status} />
                  ))}
                </ul>
              ) : (
                <p className={styles.groupEmpty}>Nenhum livro neste grupo.</p>
              )}
            </section>
          );
        })}
      </div>

      {entries.length === 0 && (
        <p className={styles.empty}>Sua estante ainda está vazia.</p>
      )}
    </main>
  );
}

function ShelfBook({
  entry,
  status,
}: {
  entry: ShelfEntry;
  status: ShelfStatus;
}) {
  return (
    <li className={styles.book}>
      {entry.book.coverUrl ? (
        <Image
          alt={`Capa de ${entry.book.title}`}
          className={styles.cover}
          height={150}
          src={entry.book.coverUrl}
          unoptimized
          width={100}
        />
      ) : (
        <div aria-hidden="true" className={styles.coverPlaceholder}>
          <span>{entry.book.title.slice(0, 1).toLocaleUpperCase("pt-BR")}</span>
        </div>
      )}
      <div className={styles.bookInfo}>
        <h3>{entry.book.title}</h3>
        <p>{entry.book.author}</p>
        {entry.book.genre && <span>{entry.book.genre}</span>}
        <ShelfStatusAction bookId={entry.bookId} status={status} />
      </div>
    </li>
  );
}

function ShelfError() {
  return (
    <main className={styles.errorPage}>
      <p role="alert">Não foi possível carregar sua estante. Tente novamente.</p>
    </main>
  );
}