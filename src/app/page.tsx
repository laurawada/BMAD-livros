import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.main}>
        <div className={styles.intro}>
          <h1>Letterboxd de Livros</h1>
          <p>A base da aplicação está pronta para receber as próximas histórias.</p>
        </div>
      </div>
    </main>
  );
}
