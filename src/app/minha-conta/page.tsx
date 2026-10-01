import { requireUser } from '@/server/auth/require-user';

export const dynamic = 'force-dynamic';

export default async function MinhaContaPage() {
  const user = await requireUser();

  return (
    <main style={{ maxWidth: 640, margin: '4rem auto', padding: '0 1rem' }}>
      <h1>Minha conta</h1>
      <p>{user.email}</p>
    </main>
  );
}