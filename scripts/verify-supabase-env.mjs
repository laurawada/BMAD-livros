import { pathToFileURL } from "node:url";

const requiredVariables = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

export async function verifySupabaseEnvironment(env, fetchImpl = fetch) {
  for (const name of requiredVariables) {
    if (!env[name]?.trim()) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
  }

  let projectUrl;
  try {
    projectUrl = new URL(env.NEXT_PUBLIC_SUPABASE_URL);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be a valid project URL");
  }

  if (
    projectUrl.protocol !== "https:" ||
    projectUrl.username ||
    projectUrl.password ||
    projectUrl.search ||
    projectUrl.hash ||
    (projectUrl.pathname !== "/" && projectUrl.pathname !== "")
  ) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be a project origin URL");
  }

  const projectOrigin = projectUrl.origin;
  const publicKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim();
  const endpoints = [
    ["Auth", new URL("/auth/v1/health", projectOrigin)],
    ["Data", new URL("/rest/v1/", projectOrigin)],
  ];

  for (const [service, endpoint] of endpoints) {
    let response;
    try {
      response = await fetchImpl(endpoint, {
        headers: { apikey: publicKey, accept: "application/json" },
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      throw new Error(`Supabase ${service} API could not be reached`);
    }

    if (!response.ok) {
      throw new Error(`Supabase ${service} API returned HTTP ${response.status}`);
    }
  }

  return "Supabase Auth and Data APIs responded successfully.";
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  verifySupabaseEnvironment(process.env)
    .then((message) => console.log(message))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
