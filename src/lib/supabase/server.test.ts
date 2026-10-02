import assert from 'node:assert/strict';
import test from 'node:test';

import { createSupabaseCookieMethods, createSupabaseServerClient } from './server';

test('reads request cookies and writes refreshed Supabase cookies', () => {
  const cookies = new Map([['sb-session', 'old-value']]);
  const cookieStore = {
    getAll: () => Array.from(cookies, ([name, value]) => ({ name, value })),
    set: (name: string, value: string) => cookies.set(name, value),
  } as never;
  const cookieMethods = createSupabaseCookieMethods(cookieStore);

  assert.deepEqual(cookieMethods.getAll(), [{ name: 'sb-session', value: 'old-value' }]);

  cookieMethods.setAll([
    { name: 'sb-session', value: 'new-value', options: {} as never },
    { name: 'sb-refresh', value: 'refresh-value', options: {} as never },
  ]);

  assert.deepEqual(Array.from(cookies), [
    ['sb-session', 'new-value'],
    ['sb-refresh', 'refresh-value'],
  ]);
});

test('configures the production SSR client with request cookie methods', async () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

  const cookies = new Map<string, string>();
  const cookieStore = {
    getAll: () => Array.from(cookies, ([name, value]) => ({ name, value })),
    set: (name: string, value: string) => cookies.set(name, value),
  } as never;
  let configuredCookieMethods: ReturnType<typeof createSupabaseCookieMethods> | undefined;
  const fakeClient = {} as never;

  try {
    const client = await createSupabaseServerClient({
      createClient: ((_url: string, _key: string, options: { cookies: ReturnType<typeof createSupabaseCookieMethods> }) => {
        configuredCookieMethods = options.cookies;
        return fakeClient;
      }) as never,
      getCookieStore: async () => cookieStore,
    });

    assert.equal(client, fakeClient);
    assert.ok(configuredCookieMethods);
    configuredCookieMethods.setAll([{ name: 'sb-session', value: 'persisted', options: {} as never }]);
    assert.deepEqual(Array.from(cookies), [['sb-session', 'persisted']]);
  } finally {
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

test('ignores read-only Server Component cookie writes but propagates other failures', () => {
  const readOnlyCookieMethods = createSupabaseCookieMethods({
    getAll: () => [],
    set: () => {
      throw new Error('Cookies can only be modified in a Server Action or Route Handler.');
    },
  } as never);
  assert.doesNotThrow(() =>
    readOnlyCookieMethods.setAll([{ name: 'sb-session', value: 'value', options: {} as never }]),
  );

  const failingCookieMethods = createSupabaseCookieMethods({
    getAll: () => [],
    set: () => {
      throw new Error('Cookie storage failed.');
    },
  } as never);
  assert.throws(
    () => failingCookieMethods.setAll([{ name: 'sb-session', value: 'value', options: {} as never }]),
    /Cookie storage failed\./,
  );
});