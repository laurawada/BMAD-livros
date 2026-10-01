export default function HomePage() {
  return (
    <main className="page page--home">
      <h1>Letterboxd de Livros</h1>
      <p>Seu fluxo inicial de cadastro e perfil está pronto para continuar.</p>
      <nav className="home-nav" aria-label="Navegação principal">
        <a href="/entrar">Entrar</a>
        <a href="/minha-conta">Minha conta</a>
        <a href="/cadastro">Criar conta</a>
      </nav>
    </main>
  );
}
