import assert from "node:assert/strict";
import test from "node:test";

import { ShelfUseCaseError } from "./shelf";
import { redirectUnauthenticatedShelf } from "./shelf-page-auth";

test("redirects an unauthenticated shelf request to login", () => {
  const destinations: string[] = [];
  const redirectTo = (path: string): never => {
    destinations.push(path);
    throw new Error("Redirected");
  };

  assert.throws(
    () =>
      redirectUnauthenticatedShelf(
        new ShelfUseCaseError("UNAUTHENTICATED"),
        redirectTo,
      ),
    /Redirected/,
  );
  assert.deepEqual(destinations, ["/login"]);
});

test("does not redirect for a non-authentication error", () => {
  assert.equal(
    redirectUnauthenticatedShelf(new Error("database unavailable"), () => {
      throw new Error("Unexpected redirect");
    }),
    false,
  );
});