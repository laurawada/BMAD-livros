import "server-only";
import { createShelfService } from "@/server/shelf";
import { createSupabaseServerClient } from "./server";
import { createShelfRepository } from "./shelf-repository";

export async function createShelfServerService() {
  const client = await createSupabaseServerClient();

  return createShelfService(
    {
      async getUser() {
        const { data, error } = await client.auth.getUser();
        if (error || !data.user) return null;
        return { id: data.user.id };
      },
    },
    createShelfRepository(client),
  );
}