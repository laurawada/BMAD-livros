import assert from 'node:assert/strict';
import test from 'node:test';

import { resetSupabaseClientFactoryForTests, setSupabaseClientFactoryForTests } from './auth.test-helpers';

test('removes orphaned auth user when profile insert fails after signup', async () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const previousServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';

  const returnedCleanupError = new Error('admin deletion rejected');
  const thrownCleanupError = new Error('admin deletion threw');
  const loggedErrors: unknown[][] = [];
  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    loggedErrors.push(args);
  };

  const createFakeClientFactory = (deleteUser: () => Promise<{ error: Error | null }>) => (() => ({
    auth: {
      signUp: async () => ({
        data: { user: { id: 'user-123' } },
        error: null,
      }),
      admin: {
        deleteUser,
      },
    },
    from: () => ({
      insert: async () => ({
        error: { message: 'profile insert failed' },
      }),
    }),
  })) as unknown as typeof import('@supabase/supabase-js').createClient;

  try {
    const { signUpWithEmail } = await import('./auth');

    const formData = new FormData();
    formData.set('name', 'Ana Ribeiro');
    formData.set('email', 'ana@exemplo.com');
    formData.set('password', 'SenhaForte123!');

    setSupabaseClientFactoryForTests(
      createFakeClientFactory(async () => ({ error: returnedCleanupError })),
    );
    const returnedErrorResult = await signUpWithEmail(formData);

    assert.equal(returnedErrorResult.ok, false);
    assert.equal(
      returnedErrorResult.error,
      'Não foi possível completar o perfil. Tente novamente em instantes.',
    );
    assert.equal(loggedErrors.length, 1);
    assert.equal(loggedErrors[0][0], 'Failed to delete orphaned Supabase Auth user after profile insert failure.');
    assert.deepEqual(loggedErrors[0][1], {
      userId: 'user-123',
      error: returnedCleanupError,
    });

    setSupabaseClientFactoryForTests(
      createFakeClientFactory(async () => {
        throw thrownCleanupError;
      }),
    );
    const thrownErrorResult = await signUpWithEmail(formData);

    assert.equal(thrownErrorResult.ok, false);
    assert.equal(
      thrownErrorResult.error,
      'Não foi possível completar o perfil. Tente novamente em instantes.',
    );
    assert.equal(loggedErrors.length, 2);
    assert.equal(loggedErrors[1][0], 'Failed to delete orphaned Supabase Auth user after profile insert failure.');
    assert.deepEqual(loggedErrors[1][1], {
      userId: 'user-123',
      error: thrownCleanupError,
    });
  } finally {
    resetSupabaseClientFactoryForTests();
    console.error = originalConsoleError;

    if (previousUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    }

    if (previousAnonKey === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousAnonKey;
    }

    if (previousServiceRoleKey === undefined) {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    } else {
      process.env.SUPABASE_SERVICE_ROLE_KEY = previousServiceRoleKey;
    }
  }
});
