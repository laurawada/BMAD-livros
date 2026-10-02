import { getPublicProfile } from "@/server/profile/get-public-profile";
import { formatAverageRating } from "@/domain/rating/format";
import type {
  PublicProfile,
  PublicReview,
  RecentRead,
} from "@/domain/profile/types";
import styles from "./page.module.css";

// Public profile page: GET /perfil/:id (Epic 4 / Story 4.1).
//
// Next.js 16: dynamic route `params` is a Promise and this is an async Server
// Component. Props are typed via the generated global `PageProps<"/perfil/[id]">`.
export default async function PerfilPage({
  params,
}: PageProps<"/perfil/[id]">) {
  const { id } = await params;
  const profile = await getPublicProfile(id);

  if (!profile) {
    return (
      <main className={styles.page}>
        <section className={styles.notFound}>
          <h1>Perfil não encontrado</h1>
          <p>Não encontramos um perfil público para este endereço.</p>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <ProfileHeader profile={profile} />
      <ProfileStats profile={profile} />
      <RecentReadsList reads={profile.recentReads} />
      <ReviewsList reviews={profile.reviews} />
    </main>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

function ProfileHeader({ profile }: { profile: PublicProfile }) {
  return (
    <header className={styles.header}>
      {profile.profileImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- avatar URL is user-provided; no next/image domain config in this isolated slice.
        <img
          className={styles.avatar}
          src={profile.profileImageUrl}
          alt={`Foto de ${profile.name}`}
          width={96}
          height={96}
        />
      ) : (
        <span
          className={`${styles.avatar} ${styles.avatarInitials}`}
          role="img"
          aria-label={`Avatar com as iniciais de ${profile.name}`}
        >
          {getInitials(profile.name)}
        </span>
      )}
      <h1 className={styles.name}>{profile.name}</h1>
    </header>
  );
}

function ProfileStats({ profile }: { profile: PublicProfile }) {
  return (
    <section className={styles.stats} aria-label="Resumo de leitura">
      <div className={styles.stat}>
        <span className={styles.statValue}>{profile.readCount}</span>
        <span className={styles.statLabel}>
          {profile.readCount === 1 ? "livro lido" : "livros lidos"}
        </span>
      </div>
      <div className={styles.stat}>
        <span className={styles.statValue}>
          {formatAverageRating(profile.averageRating)}
        </span>
        <span className={styles.statLabel}>média das avaliações</span>
      </div>
    </section>
  );
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

function BookCover({
  coverUrl,
  title,
}: {
  coverUrl: string | null;
  title: string;
}) {
  if (coverUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- cover URL comes from the catalog provider; no next/image domain config in this isolated slice.
      <img
        className={styles.cover}
        src={coverUrl}
        alt={`Capa de ${title}`}
        width={120}
        height={180}
      />
    );
  }
  return (
    <span className={`${styles.cover} ${styles.coverPlaceholder}`} aria-hidden>
      {title}
    </span>
  );
}

function RecentReadsList({ reads }: { reads: RecentRead[] }) {
  return (
    <section className={styles.section} aria-label="Leituras recentes">
      <h2 className={styles.sectionTitle}>Leituras recentes</h2>
      {reads.length === 0 ? (
        <p className={styles.empty}>Nenhuma leitura concluída ainda.</p>
      ) : (
        <ul className={styles.coverGrid}>
          {reads.map((read) => (
            <li key={read.bookId} className={styles.coverCard}>
              <BookCover coverUrl={read.bookCoverUrl} title={read.bookTitle} />
              <span className={styles.coverTitle}>{read.bookTitle}</span>
              <time className={styles.coverDate} dateTime={read.completedAt}>
                {formatDate(read.completedAt)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <span
      className={styles.rating}
      aria-label={`Nota ${formatAverageRating(rating)} de 5`}
    >
      <span aria-hidden>★</span> {formatAverageRating(rating)}
    </span>
  );
}

function ReviewsList({ reviews }: { reviews: PublicReview[] }) {
  return (
    <section className={styles.section} aria-label="Resenhas públicas">
      <h2 className={styles.sectionTitle}>Resenhas</h2>
      {reviews.length === 0 ? (
        <p className={styles.empty}>Nenhuma resenha pública ainda.</p>
      ) : (
        <ul className={styles.reviewList}>
          {reviews.map((review) => (
            <li key={review.id} className={styles.reviewCard}>
              <div className={styles.reviewHead}>
                <span className={styles.reviewBook}>{review.bookTitle}</span>
                <RatingStars rating={review.rating} />
              </div>
              <p className={styles.reviewText}>{review.text}</p>
              <time className={styles.reviewDate} dateTime={review.createdAt}>
                {formatDate(review.createdAt)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
