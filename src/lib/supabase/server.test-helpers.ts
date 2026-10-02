import { createSupabaseServerClient } from './server';

type ServerClientFactory = typeof createSupabaseServerClient;

let serverClientFactory: ServerClientFactory = createSupabaseServerClient;

export function getSupabaseServerClient() {
  return serverClientFactory();
}

export function setSupabaseServerClientFactoryForTests(factory: ServerClientFactory) {
  serverClientFactory = factory;
}

export function resetSupabaseServerClientFactoryForTests() {
  serverClientFactory = createSupabaseServerClient;
}