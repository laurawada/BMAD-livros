import assert from "node:assert/strict";
import test from "node:test";
import { verifySupabaseEnvironment } from "./verify-supabase-env.mjs";

const validEnvironment = {
  NEXT_PUBLIC_SUPABASE_URL: "https://development-project.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "development-public-key-placeholder",
};

test("verifies Auth and Data APIs on the configured project", async () => {
  const requests = [];
  const message = await verifySupabaseEnvironment(validEnvironment, async (url, options) => {
    requests.push({ url: url.href, options });
    return { ok: true, status: 200 };
  });

  assert.match(message, /Auth and Data APIs responded successfully/);
  assert.deepEqual(
    requests.map(({ url }) => new URL(url).origin),
    [validEnvironment.NEXT_PUBLIC_SUPABASE_URL, validEnvironment.NEXT_PUBLIC_SUPABASE_URL],
  );
  assert.equal(requests[0].options.headers.apikey, validEnvironment.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  assert.match(requests[0].url, /\/auth\/v1\/health$/);
  assert.match(requests[1].url, /\/rest\/v1\/$/);
});

test("rejects missing configuration without exposing values", async () => {
  await assert.rejects(
    verifySupabaseEnvironment({ NEXT_PUBLIC_SUPABASE_URL: validEnvironment.NEXT_PUBLIC_SUPABASE_URL }),
    { message: "Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY" },
  );
});

test("rejects invalid project URLs without echoing the supplied value", async () => {
  const secretLikeValue = "not-a-url-do-not-print";
  await assert.rejects(
    verifySupabaseEnvironment({
      ...validEnvironment,
      NEXT_PUBLIC_SUPABASE_URL: secretLikeValue,
    }),
    (error) => {
      assert.match(error.message, /valid project URL/);
      assert.equal(error.message.includes(secretLikeValue), false);
      return true;
    },
  );
});

test("rejects non-HTTPS project URLs", async () => {
  await assert.rejects(
    verifySupabaseEnvironment({
      ...validEnvironment,
      NEXT_PUBLIC_SUPABASE_URL: "http://development-project.supabase.co",
    }),
    { message: "NEXT_PUBLIC_SUPABASE_URL must be a project origin URL" },
  );
});

test("trims surrounding whitespace from a public key before sending it", async () => {
  let sentKey;
  await verifySupabaseEnvironment(
    { ...validEnvironment, NEXT_PUBLIC_SUPABASE_ANON_KEY: ` ${validEnvironment.NEXT_PUBLIC_SUPABASE_ANON_KEY} ` },
    async (_url, options) => {
      sentKey = options.headers.apikey;
      return { ok: true, status: 200 };
    },
  );

  assert.equal(sentKey, validEnvironment.NEXT_PUBLIC_SUPABASE_ANON_KEY);
});

test("reports endpoint failures without exposing the URL, key, or response body", async () => {
  const responseSecret = "sensitive-response-body";
  await assert.rejects(
    verifySupabaseEnvironment(validEnvironment, async () => ({
      ok: false,
      status: 401,
      text: async () => responseSecret,
    })),
    (error) => {
      assert.equal(error.message, "Supabase Auth API returned HTTP 401");
      assert.equal(error.message.includes(validEnvironment.NEXT_PUBLIC_SUPABASE_URL), false);
      assert.equal(error.message.includes(validEnvironment.NEXT_PUBLIC_SUPABASE_ANON_KEY), false);
      assert.equal(error.message.includes(responseSecret), false);
      return true;
    },
  );
});

test("reports a Data API failure after Auth succeeds", async () => {
  let requestCount = 0;
  await assert.rejects(
    verifySupabaseEnvironment(validEnvironment, async () => {
      requestCount += 1;
      return requestCount === 1
        ? { ok: true, status: 200 }
        : { ok: false, status: 401 };
    }),
    { message: "Supabase Data API returned HTTP 401" },
  );
  assert.equal(requestCount, 2);
});

test("reports unavailable endpoints without exposing request details", async () => {
  await assert.rejects(
    verifySupabaseEnvironment(validEnvironment, async () => {
      throw new Error("internal transport detail");
    }),
    (error) => {
      assert.equal(error.message, "Supabase Auth API could not be reached");
      assert.equal(error.message.includes(validEnvironment.NEXT_PUBLIC_SUPABASE_URL), false);
      assert.equal(error.message.includes(validEnvironment.NEXT_PUBLIC_SUPABASE_ANON_KEY), false);
      return true;
    },
  );
});
