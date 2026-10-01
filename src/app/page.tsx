export default function HomePage() {
  return (
    <main style={{ padding: '2rem' }}>
      <h1>Letterboxd de Livros</h1>
      <p>Seu fluxo inicial de cadastro e perfil está pronto para continuar.</p>
      <a href="/entrar">Entrar</a>
      {' | '}
      <a href="/minha-conta">Minha conta</a>
      {' | '}
      <a href="/cadastro">Criar conta</a>
    </main>
  );
}
