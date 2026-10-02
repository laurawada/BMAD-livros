import { redirect } from 'next/navigation';

import { getSupabaseServerClient } from '@/lib/supabase/server.test-helpers';

export async function requireUser() {
  let user = null;

  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Supabase user verification failed for a private route.', error);
    }
    user = data.user;
  } catch (error) {
    console.error('Supabase user verification failed for a private route.', error);
  }

  if (!user) {
    redirect('/entrar');
  }

  return user;
}