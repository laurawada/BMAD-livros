# Architecture Spine Review Gate

Date: 2026-09-27
Target: `../ARCHITECTURE-SPINE.md`

## Verdict

PASS after fixes. Deterministic lint: 0 findings. Final architecture rubric review: PASS. Final stack-source verification: PASS. Final product-spec reconciliation: PASS. Final route/product-surface reconciliation: PASS. Final data-model reconciliation: PASS subject to the explicitly deferred source-document alignment. Final adversarial check: no remaining divergence holes.

## Resolved Findings

- Added separate compile-time dependency and runtime-flow diagrams.
- Made first-use book adoption transactional and idempotent; Google volume `id` maps to unique `externalId`.
- Shelf-only adds default to `Quero ler`, repeat adds preserve current status, and shelf-entry deletion is out of MVP.
- Review edits preserve `createdAt`, advance `updatedAt`, and feeds sort by `createdAt DESC, id DESC`; deleting a review preserves Shelf status.
- Half-star values use unconstrained `NUMERIC NOT NULL`, database range/step checks, and one display-rounding rule.
- Vibes are trimmed/lowercased, database-canonical, unique per user/book/value, and displayed once per book.
- Public recent reads expose only a restricted `Lido` projection and sort by `updatedAt DESC, id DESC`.
- Specified Google Books pagination, volume-field mapping, attribution, and links.
- Added exact page routes/content, original visual direction, MVP exclusions, and profile/shelf aggregate behavior.
- Reconciled operational and provider constraints with official sources and called out commercial-use gates.

## Deferred Source Alignment

The provided `data-model.md` still proposes `User.email` and `User.passwordHash`; the architecture assigns credentials exclusively to Supabase Auth. The spine explicitly identifies this companion update as a prerequisite before implementation. No source companion was edited in this run.
