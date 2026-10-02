import { redirect } from 'next/navigation';

import { requireUser } from '@/server/auth/require-user';

export const dynamic = 'force-dynamic';

export default async function MinhaContaPage() {
  const user = await requireUser();

  // A área autenticada de conta usa o mesmo perfil público, evitando manter
  // duas representações diferentes da identidade do usuário.
  redirect(`/perfil/${user.id}`);
}
