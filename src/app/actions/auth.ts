'use server';

import { createClient } from '@supabase/supabase-js';

import { validateSignUpData } from '@/lib/auth';
import { getSupabaseClientFactory } from './auth.test-helpers';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function signUpWithEmail(formData: FormData) {
  const rawName = String(formData.get('name') ?? '').trim();
  const rawEmail = String(formData.get('email') ?? '').trim();
  const rawPassword = String(formData.get('password') ?? '');

  const validation = validateSignUpData({
    name: rawName,
    email: rawEmail,
    password: rawPassword,
  });

  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  if (!url || !anonKey || !serviceRoleKey) {
    return {
      ok: false,
      error: 'As configurações do Supabase ainda não foram definidas no ambiente.',
    };
  }

  const supabaseClientFactory = getSupabaseClientFactory();
  const supabase = supabaseClientFactory(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const adminSupabase = supabaseClientFactory(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase.auth.signUp({
    email: rawEmail,
    password: rawPassword,
    options: {
      data: {
        name: validation.normalizedName,
      },
    },
  });

  if (error) {
    return {
      ok: false,
      error: 'Não foi possível criar a conta. Verifique os dados e tente novamente.',
    };
  }

  if (!data.user) {
    return {
      ok: false,
      error: 'A conta foi criada, mas não foi possível concluir o perfil.',
    };
  }

  const { error: profileError } = await adminSupabase
    .from('profiles')
    .insert({
      id: data.user.id,
      name: validation.normalizedName,
      profile_image_url: null,
    });

  if (profileError) {
    try {
      const { error: cleanupError } = await adminSupabase.auth.admin.deleteUser(data.user.id);

      if (cleanupError) {
        console.error('Failed to delete orphaned Supabase Auth user after profile insert failure.', {
          userId: data.user.id,
          error: cleanupError,
        });
      }
    } catch (cleanupError) {
      console.error('Failed to delete orphaned Supabase Auth user after profile insert failure.', {
        userId: data.user.id,
        error: cleanupError,
      });
    }

    return {
      ok: false,
      error: 'Não foi possível completar o perfil. Tente novamente em instantes.',
    };
  }

  return {
    ok: true,
    message: 'Conta criada com sucesso.',
    userId: data.user.id,
  };
}
