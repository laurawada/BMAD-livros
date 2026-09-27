# Architecture Spine Validation

**Target:** `ARCHITECTURE-SPINE.md`  
**Inputs reviewed:** `SPEC.md`, `product-surface.md`, `data-model.md`  
**Verdict:** Needs revision before handoff. The spine is broadly complete and its deterministic lint passes, but it contains unresolved cross-unit decisions around RPC authorization and book adoption for vibes, plus a dependency-direction contradiction.

## Findings

### High - RPC authorization mode is not bound

**Section:** Invariants & Rules, AD-2 and AD-6  
**Why it matters:** AD-2 assigns the combined write to a server-only database transaction/RPC, while AD-6 declares grants and RLS the authoritative authorization boundary. The spine does not say whether the RPC executes as invoker or definer, nor otherwise require equivalent ownership checks and execution grants. A `SECURITY DEFINER` implementation may bypass table RLS; independently implemented mutation paths could therefore enforce different authorization rules.
**Clear fix:** Bind the RPC to invoker security and require caller claims/RLS to apply, or explicitly specify and test the complete ownership checks, restricted `EXECUTE` grants, and hardened definer configuration if definer security is required.

### High - CAP-4 cannot adopt an otherwise unpersisted book

**Section:** Invariants & Rules, AD-2; Capability -> Architecture Map, CAP-4  
**Why it matters:** AD-2 permits a Google volume to be upserted locally only when first added to a shelf or reviewed. CAP-4 permits users to attach `BookVibe` records to a book, and AD-3 makes those records database-owned with a `bookId`. A user who adds a vibe without shelving or reviewing the book has no permitted way to obtain that referenced `Book`; builders must either reject the action or violate the adoption rule.
**Clear fix:** Include the first persisted vibe mutation as a local-book adoption trigger, with the upsert and vibe write atomic. Alternatively, explicitly narrow CAP-4 to already-adopted books, but that would constrain the current product contract.

### Medium - Dependency diagram contradicts the stated dependency rule

**Section:** Design Paradigm  
**Why it matters:** The prose says dependencies point inward, but the diagram draws `APP -> DB` and `APP -> BOOKS`, where DB and BOOKS are infrastructure adapters. Read as a dependency graph, that directs application code toward adapters, contrary to the stated rule that application logic uses infrastructure ports. Read as runtime calls, the graph is plausible but its edges are not identified as runtime flow. Teams can choose incompatible import and port ownership patterns.
**Clear fix:** Label the existing graph as runtime call/data flow and add or substitute a compile-time dependency graph showing adapters implement ports owned inward (application/domain), with dependencies pointing toward those port declarations.

### Low - Deferred database version does not require environment parity

**Section:** Deferred, PostgreSQL major version  
**Why it matters:** Preview/development and prototype production use separate Supabase projects, but the Deferred item only says to select a provider-supported PostgreSQL major version. It does not bind both projects to that same major, leaving room for an unnoticed compatibility difference.
**Clear fix:** Keep the exact major deferred until bootstrap, but state that all environments use the same supported PostgreSQL major and verify parity when projects are provisioned.

## Checklist Summary

| Area | Assessment |
| --- | --- |
| Paradigm | Decided: modular monolith; diagram edge semantics conflict with the inward dependency rule. |
| Data ownership | Decided: PostgreSQL owns app state; Auth owns identity. CAP-4 book adoption needs reconciliation. |
| Mutation | Decided: transactional writes, one shelf status, editable active review, derived averages. |
| Security | Principled boundary is decided; RPC execution/privilege semantics remain underspecified. |
| Deployment and operations | Substrate and separate environments are named; email, quota, backups, restore, domain, and monitoring are explicitly gated before real users. |
| Provider constraints | Google Books search/attribution/link/no-alteration rules and non-commercial deployment constraints are stated. Current official checks corroborate the cited Next.js runtime, Supabase Free constraints, Vercel Hobby use restriction, and Google Books constraints. |
| Deferred divergence | Most items are conditional and bounded. Database-major parity needs an explicit cross-environment invariant. |
| Source coverage | CAP-1 through CAP-6 are mapped; CAP-4 exposes the adoption gap above. |

## Validation

The deterministic `lint_spine.py` check passed with 0 findings. Official documentation checked: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [Supabase pricing](https://supabase.com/pricing), [Vercel pricing and plan terms](https://vercel.com/pricing), [Google Books terms](https://developers.google.com/books/terms), and [Google Books branding](https://developers.google.com/books/branding).