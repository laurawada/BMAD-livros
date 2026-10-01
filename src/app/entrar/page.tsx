'use client';

import { FormEvent, useState } from 'react';

import { signInWithEmail } from '../actions/session';

const GENERIC_SIGN_IN_ERROR = 'Não foi possível entrar. Verifique seu e-mail e senha e tente novamente.';

export default function EntrarPage() {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await signInWithEmail(new FormData(event.currentTarget));
      setError(result.error ?? GENERIC_SIGN_IN_ERROR);
    } catch {
      setError(GENERIC_SIGN_IN_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page page--auth">
      <h1>Entrar</h1>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          E-mail
          <input name="email" type="email" autoComplete="email" required />
        </label>

        <label>
          Senha
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      {error ? (
        <p role="alert">
          {error}
        </p>
      ) : null}
      <p>
        Ainda não tem uma conta? <a href="/cadastro">Criar conta</a>
      </p>
    </main>
  );
}