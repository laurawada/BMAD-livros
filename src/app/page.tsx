import Link from "next/link";
import HomeCommunity from "./home-community";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="Letterboxd de Livros, início">
          <span className={styles.brandMark} aria-hidden="true">L</span>
          <span>Letterboxd <strong>de Livros</strong></span>
        </Link>
        <nav className={styles.navigation} aria-label="Navegação principal">
          <Link className={styles.activeLink} href="/">Início</Link>
          <Link href="/buscar">Buscar livros</Link>
        </nav>
        <Link className={styles.headerCta} href="/buscar">Encontrar um livro</Link>
      </header>

      <div className={styles.content}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Um lugar para leitores</p>
            <h1>Histórias boas começam com uma descoberta.</h1>
            <p className={styles.lead}>Encontre seu próximo livro e, em breve, descubra o que a comunidade está lendo e resenhando.</p>
            <Link className={styles.primaryCta} href="/buscar">Buscar livros <span aria-hidden="true">→</span></Link>
          </div>
          <div className={styles.heroArtwork} aria-hidden="true">
            <div className={`${styles.book} ${styles.bookOne}`}><span>novas<br />histórias</span></div>
            <div className={`${styles.book} ${styles.bookTwo}`}><span>uma página<br />de cada vez</span></div>
            <div className={`${styles.book} ${styles.bookThree}`}><span>descobrir<br />&amp; ler</span></div>
            <span className={styles.sparkle}>✳</span>
          </div>
        </section>

        <HomeCommunity />
      </div>

      <footer className={styles.footer}>
        <span>Letterboxd de Livros</span>
        <span>Descubra. Leia. Compartilhe.</span>
      </footer>
    </main>
  );
}
