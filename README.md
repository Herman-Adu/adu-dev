# adu-dev

The Adu Dev agency site — cinematic front end, typed contracts, Strapi-ready back end.

- **Stack:** Next.js 16 · React 19 · TypeScript · GSAP · Three.js · Framer Motion
- **Content:** Strapi 5 + PostgreSQL (contract-first; the CMS implements the schema, it does not define it)
- **Design canvas:** tokens, scroll spine and page designs live on the Design artifact

## Architecture

Hybrid atomic + feature-sliced:

- `src/global/ui` — atoms and molecules only, zero domain knowledge
- `src/features/<name>` — each feature owns its `lib/`, `schemas/`, `actions/`, `components/`
- `src/features/<name>/lib/contract.ts` — the Zod schema and source interface for that feature

Organisms live inside features, never globally. A back end is swapped by writing a new
adapter against the existing contract, not by touching components.

## Status

Design phase. Nothing deployed yet.
