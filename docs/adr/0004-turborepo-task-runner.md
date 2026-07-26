# Run workspace tasks through Turborepo

Repository-wide checks ran as `&&` chains — `pnpm test:strapi && pnpm test:next` — which repeat every task on every invocation regardless of what changed. We route `build`, `test`, `typecheck` and `lint` through **Turborepo**, declared in `turbo.json`, so each task is hashed against its inputs and skipped when those inputs are unchanged. Measured here: `typecheck` 3.4s cold, 58ms warm; `build` 25.2s cold, 102ms warm.

The timing is the point. This lands **before** path-filtered CI (#14), because #14 exists to stop CI rebuilding the frontend when only the backend changed — and that is what a task runner already does. Verified directly: editing one file in `apps/strapi` and rebuilding reports `1 cached, 2 total`, having rebuilt Strapi and left Next cached. Hand-maintaining path globs in a workflow file would rebuild that behaviour badly, and then have to be deleted when Turbo arrived anyway.

## Considered Options

Keeping the `&&` chains is free and has no new dependency, which is the honest argument for it. We rejected it because the cost is paid on every run by every developer and every CI job, and because it cannot express the one relationship that is about to matter: when `@repo/strapi-types` lands (#12), the frontend genuinely depends on a package that must be built first. `dependsOn: ["^build"]` states that once; a shell chain restates it in every script that needs it, and silently rots when one is missed.

Nx and Rush solve the same problem. We chose Turborepo because the reference implementation this template follows ([notum-cz/strapi-next-monorepo-starter](https://github.com/notum-cz/strapi-next-monorepo-starter)) already uses it, so its `turbo.json` is a worked example for this exact Strapi-plus-Next shape rather than a generic one. Matching it costs nothing and means anyone moving between the two repositories recognises the commands.

`pnpm dev` is deliberately **not** a Turbo task. It starts Strapi, waits for port 1337, then starts Next, because the frontend reads redirects from the backend during startup. Turbo runs persistent tasks in parallel and offers no equivalent readiness gate, so making `dev` a Turbo task would trade a working ordering for a race. It keeps its `concurrently` and `wait-on` wiring.

## Consequences

Root `build`, `test` and `typecheck` now invoke `turbo run`, with `--filter=<workspace>` for the per-app variants. The workspace names are `nextjs` and `strapi`, not the directory names.

One naming change was forced and is worth stating plainly: both apps used `test` for the watcher and `test:run` for a single pass, so `turbo run test` would have started a watcher and never exited. They now follow the reference convention — `test` is a single pass, `test:watch` is the watcher. Anyone with `pnpm test` in muscle memory for watch mode wants `pnpm test:watch`.

Turbo's `outputs` list build artefacts only: `.next/**` excluding its cache, and `dist/**`. Notably `apps/strapi/public/` is **not** an output, unlike in the reference — it holds uploaded media rather than build product, and caching it would restore stale uploads.

`.turbo` is git-ignored. Caching is local only; no remote cache is configured, and enabling one would be a separate decision with its own privacy considerations.
