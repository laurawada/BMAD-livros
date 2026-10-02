import assert from 'node:assert/strict';
import test from 'node:test';

import {
  resetSupabaseServerClientFactoryForTests,
  setSupabaseServerClientFactoryForTests,
} from '@/lib/supabase/server.test-helpers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireUser } from '@/server/auth/require-user';
import MinhaContaPage from '../minha-conta/page';
import { signInWithEmail } from './session';

const GENERIC_SIGN_IN_ERROR = 'Não foi possível entrar. Verifique seu e-mail e senha e tente novamente.';

function createFormData(email = 'ana@exemplo.com', password = 'SenhaForte123!') {
  const formData = new FormData();
  formData.set('email', email);
  formData.set('password', password);
  return formData;
}

test('establishes a verified session without returning credentials', async () => {
  const verifiedUser = { id: 'user-123', email: 'ana@exemplo.com' };
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  const cookies = new Map<string, string>();

  setSupabaseServerClientFactoryForTests(async () =>
    createSupabaseServerClient({
      createClient: ((_url: string, _key: string, options: { cookies: { setAll: (items: never[]) => void } }) => ({
        auth: {
          signInWithPassword: async () => {
            options.cookies.setAll([{ name: 'sb-session', value: 'persisted-session', options: {} } as never]);
            return { data: { user: verifiedUser }, error: null };
          },
          getUser: async () => ({ data: { user: verifiedUser }, error: null }),
        },
      })) as never,
      getCookieStore: async () =>
        ({
          getAll: () => Array.from(cookies, ([name, value]) => ({ name, value })),
          set: (name: string, value: string) => cookies.set(name, value),
        }) as never,
    }),
  );

  try {
    await assert.rejects(signInWithEmail(createFormData()), (error: { digest?: string }) =>
      error.digest?.includes(';/;') ?? false,
    );
    assert.deepEqual(Array.from(cookies), [['sb-session', 'persisted-session']]);
  } finally {
    resetSupabaseServerClientFactoryForTests();
    if (previousUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    }
    if (previousKey === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousKey;
    }
  }
});

test('rejects a session when the verified identity differs from the sign-in identity', async () => {
  let signOutCalls = 0;
  let signOutScope: string | undefined;
  const cleanupError = new Error('local session cleanup failed');
  const loggedErrors: unknown[][] = [];
  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    loggedErrors.push(args);
  };

  setSupabaseServerClientFactoryForTests(async () => ({
    auth: {
      signInWithPassword: async () => ({ data: { user: { id: 'user-123' } }, error: null }),
      getUser: async () => ({ data: { user: { id: 'user-456' } }, error: null }),
      signOut: async (options: { scope?: string }) => {
        signOutCalls += 1;
        signOutScope = options.scope;
        return { error: cleanupError };
      },
    },
  }) as never);

  try {
    const result = await signInWithEmail(createFormData());
    assert.deepEqual(result, { ok: false, error: GENERIC_SIGN_IN_ERROR });
    assert.equal(signOutCalls, 1);
    assert.equal(signOutScope, 'local');
    assert.deepEqual(loggedErrors, [
      ['Supabase failed to clear the rejected local sign-in session.', cleanupError],
    ]);
  } finally {
    resetSupabaseServerClientFactoryForTests();
    console.error = originalConsoleError;
  }
});

test('uses the generic error and skips Supabase for malformed credentials', async () => {
  let signInCalls = 0;
  setSupabaseServerClientFactoryForTests(async () => ({
    auth: {
      signInWithPassword: async () => {
        signInCalls += 1;
        return { data: { user: null }, error: null };
      },
    },
  }) as never);

  try {
    for (const formData of [createFormData('not-an-email'), createFormData('ana@exemplo.com', '')]) {
      const result = await signInWithEmail(formData);
      assert.deepEqual(result, { ok: false, error: GENERIC_SIGN_IN_ERROR });
    }
    assert.equal(signInCalls, 0);
  } finally {
    resetSupabaseServerClientFactoryForTests();
  }
});

test('returns the same safe error for invalid credentials and unavailable sessions', async () => {
  let sessionCleanupCalls = 0;
  const originalConsoleError = console.error;
  console.error = () => undefined;

  try {
    for (const failure of [
      async () => ({
        auth: {
          signInWithPassword: async () => ({ data: { user: null }, error: new Error('User not found') }),
          getUser: async () => ({ data: { user: null }, error: null }),
        },
      }),
      async () => ({
        auth: {
          signInWithPassword: async () => ({ data: { user: null }, error: new Error('Invalid password') }),
          getUser: async () => ({ data: { user: null }, error: null }),
        },
      }),
      async () => ({
        auth: {
          signInWithPassword: async () => ({ data: { user: { id: 'user-123' } }, error: null }),
          getUser: async () => ({ data: { user: null }, error: new Error('Session unavailable') }),
          signOut: async () => {
            sessionCleanupCalls += 1;
            return { error: null };
          },
        },
      }),
      async () => {
        throw new Error('Supabase unavailable');
      },
    ]) {
      setSupabaseServerClientFactoryForTests(failure as never);
      const result = await signInWithEmail(createFormData());
      assert.deepEqual(result, { ok: false, error: GENERIC_SIGN_IN_ERROR });
    }
    assert.equal(sessionCleanupCalls, 1);
  } finally {
    resetSupabaseServerClientFactoryForTests();
    console.error = originalConsoleError;
  }
});

test('denies a direct private-route request before querying personal data', async () => {
  let personalDataQueries = 0;
  const originalConsoleError = console.error;
  console.error = () => undefined;
  setSupabaseServerClientFactoryForTests(async () => ({
    auth: {
      getUser: async () => ({ data: { user: null }, error: new Error('No session') }),
    },
    from: () => {
      personalDataQueries += 1;
      throw new Error('Personal data must not be queried');
    },
  }) as never);

  try {
    await assert.rejects(requireUser(), (error: { digest?: string }) =>
      error.digest?.includes('/entrar') ?? false,
    );
    assert.equal(personalDataQueries, 0);
  } finally {
    resetSupabaseServerClientFactoryForTests();
    console.error = originalConsoleError;
  }
});

test('denies a direct profile-route render before querying personal data', async () => {
  let personalDataQueries = 0;
  const originalConsoleError = console.error;
  console.error = () => undefined;
  setSupabaseServerClientFactoryForTests(async () => ({
    auth: {
      getUser: async () => ({ data: { user: null }, error: new Error('No session') }),
    },
    from: () => {
      personalDataQueries += 1;
      throw new Error('Personal data must not be queried');
    },
  }) as never);

  try {
    await assert.rejects(MinhaContaPage(), (error: { digest?: string }) =>
      error.digest?.includes('/entrar') ?? false,
    );
    assert.equal(personalDataQueries, 0);
  } finally {
    resetSupabaseServerClientFactoryForTests();
    console.error = originalConsoleError;
  }
});

test('renders the verified user on the private profile route', async () => {
  const verifiedUser = { id: 'user-123', email: 'ana@exemplo.com' };
  setSupabaseServerClientFactoryForTests(async () => ({
    auth: {
      getUser: async () => ({ data: { user: verifiedUser }, error: null }),
    },
  }) as never);

  try {
    await assert.rejects(MinhaContaPage(), (error: { digest?: string }) =>
      error.digest?.includes('/perfil/user-123') ?? false,
    );
  } finally {
    resetSupabaseServerClientFactoryForTests();
  }
});
