'use server';

import { redirect } from 'next/navigation';

import { getSupabaseServerClient } from '@/lib/supabase/server.test-helpers';

const GENERIC_SIGN_IN_ERROR = 'Não foi possível entrar. Verifique seu e-mail e senha e tente novamente.';

export async function signInWithEmail(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
    return { ok: false, error: GENERIC_SIGN_IN_ERROR };
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      if (error) {
        console.error('Supabase email sign-in failed.', error);
      }
      return { ok: false, error: GENERIC_SIGN_IN_ERROR };
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user || userData.user.id !== data.user.id) {
      if (userError) {
        console.error('Supabase email sign-in session could not be verified.', userError);
      }
      const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
      if (signOutError) {
        console.error('Supabase failed to clear the rejected local sign-in session.', signOutError);
      }
      return { ok: false, error: GENERIC_SIGN_IN_ERROR };
    }

  } catch (error) {
    console.error('Supabase email sign-in could not establish a session.', error);
    return { ok: false, error: GENERIC_SIGN_IN_ERROR };
  }

  redirect('/');
}