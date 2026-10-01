import { fixturesProfileReadAdapter } from "@/infrastructure/profile/fixtures-profile-read";
import type { ProfileReadPort } from "@/domain/profile/profile-read-port";
import type { PublicProfile } from "@/domain/profile/types";

// Server-only public-profile query (Epic 4 / Story 4.1).
//
// This module runs only on the server (AD-1 layering: app -> server -> domain,
// with infrastructure implementing the port). The UI must import `getPublicProfile`
// from HERE and never reach into the adapter directly, so the data source stays
// swappable behind the port.
//
// NOTE: the project does not currently depend on the `server-only` package, so
// this file documents its server-only contract instead of importing the marker.
// It must not be imported from Client Components.

// TODO (deferred): swap `activeAdapter` to a Supabase RLS-backed ProfileReadPort
// once Epics 1 & 3 land. The RLS policies are the authoritative public-projection
// boundary (AD-6); the fixtures adapter is only the ISOLATED-mode stand-in.
const activeAdapter: ProfileReadPort = fixturesProfileReadAdapter;

export function getPublicProfile(
  userId: string,
): Promise<PublicProfile | null> {
  return activeAdapter.getPublicProfile(userId);
}
