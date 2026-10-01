import { createClient } from '@supabase/supabase-js';

let supabaseClientFactory: typeof createClient = createClient;

export function getSupabaseClientFactory() {
  return supabaseClientFactory;
}

export function setSupabaseClientFactoryForTests(factory: typeof createClient) {
  supabaseClientFactory = factory;
}

export function resetSupabaseClientFactoryForTests() {
  supabaseClientFactory = createClient;
}