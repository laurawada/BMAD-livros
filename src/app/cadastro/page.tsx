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
    <main style={{ maxWidth: 480, margin: '4rem auto', padding: '0 1rem' }}>
      <h1>Criar conta</h1>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
        <label>
          Nome
          <input name="name" type="text" required style={{ display: 'block', width: '100%' }} />
        </label>

        <label>
          E-mail
          <input name="email" type="email" required style={{ display: 'block', width: '100%' }} />
        </label>

        <label>
          Senha
          <input
            name="password"
            type="password"
            minLength={8}
            required
            style={{ display: 'block', width: '100%' }}
          />
        </label>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Cadastrando...' : 'Criar conta'}
        </button>
      </form>

      {error ? (
        <p role="alert" style={{ color: '#b91c1c', marginTop: '1rem' }}>
          {error}
        </p>
      ) : null}

      {status ? <p style={{ color: '#166534', marginTop: '1rem' }}>{status}</p> : null}
    </main>
  );
}
