import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

type CookieStore = Awaited<ReturnType<typeof cookies>>;
type ServerClientDependencies = {
  createClient?: typeof createServerClient;
  getCookieStore?: typeof cookies;
};

export function createSupabaseCookieMethods(cookieStore: CookieStore) {
  return {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet: Array<{ name: string; value: string; options: Parameters<CookieStore['set']>[2] }>) {
      try {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes('Cookies can only be modified in a Server Action or Route Handler')
        ) {
          return;
        }
        throw error;
      }
    },
  };
}

export async function createSupabaseServerClient(dependencies: ServerClientDependencies = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const { createClient = createServerClient, getCookieStore = cookies } = dependencies;

  if (!url || !anonKey) {
    throw new Error('Supabase server configuration is missing.');
  }

  const cookieStore = await getCookieStore();

  return createClient(url, anonKey, {
    cookies: createSupabaseCookieMethods(cookieStore),
  });
}