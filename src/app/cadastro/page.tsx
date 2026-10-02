'use client';

import { FormEvent, useState } from 'react';

import { signUpWithEmail } from '../actions/auth';

export default function CadastroPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const result = await signUpWithEmail(formData);

    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error ?? 'Não foi possível criar a conta.');
      return;
    }

    setStatus(result.message ?? 'Conta criada com sucesso.');
    event.currentTarget.reset();
  }

  return (
    <main className="page page--auth">
      <h1>Criar conta</h1>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Nome
          <input name="name" type="text" required />
        </label>

        <label>
          E-mail
          <input name="email" type="email" required />
        </label>

        <label>
          Senha
          <input
            name="password"
            type="password"
            minLength={8}
            required
          />
        </label>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Cadastrando...' : 'Criar conta'}
        </button>
      </form>

      {error ? (
        <p role="alert">
          {error}
        </p>
      ) : null}

      {status ? <p className="feedback-success">{status}</p> : null}
    </main>
  );
}
