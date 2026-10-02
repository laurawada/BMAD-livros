import { requireUser } from '@/server/auth/require-user';

export const dynamic = 'force-dynamic';

export default async function MinhaContaPage() {
  const user = await requireUser();

  return (
    <main className="page page--profile">
      <h1>Minha conta</h1>
      <p className="profile-email">{user.email}</p>
    </main>
  );
}