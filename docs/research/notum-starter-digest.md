# Notum Strapi + Next.js monorepo starter: digest for adu-dev

Researched 2026-11-27 from primary sources only. Nothing was installed, built or run, and the fork was not modified.

**Source keys** (each claim below ends with one):

- `U:` the GitHub repo `notum-cz/strapi-next-monorepo-starter` at tag **v3.6.1**. `gh api .../commits/v3.6.1` returned `2a6701e9f2d5642c4ff5f8e1058608134f317fd4`, committed 2026-11-17T18:44:07Z. It is the latest release (v3.6.0 also shipped 2026-11-17; v3.5.0 2026-08-28).
- `D:` shorthand for `U:apps/docs/docs/`.
- `PR#n`: an upstream pull request body, read with `gh api repos/notum-cz/strapi-next-monorepo-starter/pulls/n`.
- `F:` the local fork at `C:\Users\herma\source\repository\strapi-projects\notum-starter-testbed`. Its remote is `Herman-Adu/notum-starter-testbed` and its HEAD is `d5464b6e`, 2026-10-04 13:53 +0100.
- `FD:` shorthand for `F:apps/docs/docs/`.

**Labels:** UNVERIFIED means I could not confirm it from a primary source. MY-INFERENCE means my own reasoning, not something a source states.

**Spot checks after writing (2026-11-27).** Independently re-checked: the fork contains upstream's v3.4.1 commit and neither v3.5.0 nor v3.6.1 (`git cat-file -e`); `pnpm-lock.yaml` in the fork holds `ckeditor5@48.4.0`, `dompurify@3.4.12`, `zod@4.4.3`, `lodash@4.17.23`, `happy-dom@20.8.9` and `@strapi/strapi@5.48.1`; GitHub's advisory database (`gh api advisories?affects=<pkg>@<version>`) confirms high-severity advisories for ckeditor5 (GHSA-rh54-vffm-5fvp), zod (GHSA-mrhx-c7xc-m3w5), lodash (GHSA-r5fr-rjxr-66jc) and happy-dom, lists none for Strapi 5.48.1, and rates dompurify's lower than first written (corrected below). The most serious confirmed item: the fork's lockfile holds `tinypool@1.1.1`, which has **two critical** advisories (GHSA-5gmw-xhrv-c9v3, GHSA-85c8-ppgw-ccpr); it comes in through build tooling (`@docusaurus/core`), not the running site.

## Bottom line

- **The pins check out.** Upstream is on Node `^26.0.0` (`.nvmrc` = `26`) with `packageManager: pnpm@12.18.0` (`U:package.json`, `U:.nvmrc`). The fork is on Node `^24.0.0` (`.nvmrc` = `24`) with `pnpm@11.21.0` (`F:package.json`, `F:.nvmrc`). The fork's last commit is 2026-10-04 (`git log -1`). None of the three expected facts is contradicted.
- **The fork is further behind than its commit date suggests.** It was cut from upstream **v3.4.1** (`5778c3b3`, 2026-06-24), and no upstream commit after that tag exists in the fork's object store (`git cat-file -e`). The gap is **41 upstream commits and 300 files** (`gh api compare/v3.4.1...v3.6.1`), not just the 19 commits made since 2026-10-04.
- **The fork's lockfile carries packages that upstream now flags as vulnerable:**
  - `ckeditor5@48.4.0`: XSS (GHSA-rh54-vffm-5fvp), fixed in 48.5.1.
  - `dompurify@3.4.12`: fixed in 3.4.17. **Corrected after a check:** GitHub's advisory database lists 4 low and 1 medium advisory for this version, and rates GHSA-cg2g-xh64-v4q7 *low*, not critical as first written here (the severity came from upstream's override comment).
  - `zod@4.4.3`: high (GHSA-mrhx-c7xc-m3w5), fixed in 4.6.6.
  - `happy-dom@20.8.9`: 2 high, fixed in 21.0.4.
  - `lodash@4.17.23`: high (`_.template` injection), fixed in 4.18.1.

  Sources: `F:pnpm-lock.yaml` for the versions, `U:pnpm-workspace.yaml` override comments for the advisories. Strapi is 5.48.1 in the fork against 5.62.0 upstream, and 5.62.0 "carries a security fix whose details Strapi has not disclosed yet" (PR#480).
- **The four upstream changes that matter most to the fork:**
  - #480: Node 26 and pnpm 12, a full dependency refresh, and a rewrite of the overrides.
  - #492: 44 of 48 root advisories fixed.
  - #487: the leak guard.
  - #474: k6 load tests.

  All merged 2026-11-17. #359 (2026-07-03) added rate limiting on the users-permissions auth endpoints. I found no rate-limit config under `F:apps/strapi/config` (grep).
- **`pnpm verify` exists only in the fork.** Upstream has no `verify` script. Its gate is the CI job "Install, Lint, Test and Build" (`U:package.json`, `U:.github/workflows/ci.yml`). The fork's `verify` runs `turbo run lint typecheck test types:check` plus four guard scripts (`F:package.json`).
- **Upstream's PR CI never runs `pnpm typecheck`.** It runs lint, format:check, test:ci, build:ui and build:strapi (`U:.github/workflows/ci.yml`). The `main` ruleset requires only that one check, plus 1 approval, resolved threads, merge-commit only, and CodeQL at high or above (`gh api .../rules/branches/main`).
- **Upstream shape:**
  - `apps/{ui,strapi,docs}`.
  - `packages/{shared-data,logging,design-system,strapi-types,eslint-config,typescript-config,semantic-release-config}`.
  - `qa/tests/playwright`.

  Turborepo builds shared-data, design-system and logging before `dev` (`U:pnpm-workspace.yaml`, `U:turbo.json`, `U:CLAUDE.md`).
- **The starter's core design conflicts with the adu-dev contract rule.** The UI is typed directly by Strapi-generated types (`@repo/strapi-types`: `Data.Component<UID>`, `Result<UID, Params>`, a registry keyed by `UID.Component`), and responses get no runtime validation (`U:apps/ui/src/lib/strapi-api/base.ts`, `D:page-builder/introduction.md`). See section I.
- **Parts worth taking as they are:**
  - The `pnpm-workspace.yaml` supply-chain policy: `minimumReleaseAge`, `allowBuilds`, and `<fixed` override selectors with a comment on each.
  - The composite setup action.
  - The BFF proxy with an endpoint allowlist.
  - Document-middleware revalidation that sends a bearer secret.
  - The Strapi schema-check script.
  - The seed export and runner.
  - The worktree manifest.
- **Deploy docs upstream** cover GitHub Pages (docs site only), Heroku, Vercel (UI only) and Docker. Azure appears only as integrations and is never documented as a deploy target. The fork adds Hostinger VPS, a docs container and a preview environment (`D:reference/deployment/*`, `FD:reference/deployment/*`).
- **The upstream docs disagree with the code in at least six places.** The biggest: the Auto PR env-var extraction, `test:ci` scope, whether `sync-types` is needed, and the missing leak-guard workflow. See "Unverified / open".

---

## A. Monorepo shape

**Workspaces.** The globs are `packages/*`, `apps/*` and `qa/**` (`U:pnpm-workspace.yaml`).

| Workspace | Purpose | Source |
|---|---|---|
| `apps/ui` (`@repo/ui`) | Next.js 16 App Router, React 19, Tailwind v4, shadcn/ui, Better Auth, next-intl | `U:CLAUDE.md`, `U:apps/ui/package.json` |
| `apps/strapi` (`@repo/strapi`) | Strapi 5, Postgres in Docker (SQLite also mentioned) | `U:CLAUDE.md`, `D:getting-started/features.md` |
| `apps/docs` (`@repo/docs`) | Docusaurus 3, port 3300 | `U:apps/docs/package.json` |
| `packages/shared-data` | Runtime constants and path helpers shared by UI and Strapi; built with `tsc` to `dist/` | `D:reference/packages/shared-data.md` |
| `packages/logging` | pino plus OpenTelemetry; `.` and `./azure` exports; server-first | `D:reference/packages/logging.md` |
| `packages/design-system` | Tailwind v4 tokens, Roboto fonts, generated CKEditor/TipTap configs, `styles-strapi.json` | `D:reference/packages/design-system.md` |
| `packages/strapi-types` | Re-exports `Data/Modules/Schema/UID` from `@strapi/strapi` plus generated `.d.ts`; types only | `D:reference/packages/strapi-types.md`, `U:packages/strapi-types/src/index.ts` |
| `packages/eslint-config` | Flat config for ESLint 10; wraps `eslint-plugin-react` with `fixupPluginRules` | `D:reference/packages/eslint-config.md` |
| `packages/typescript-config` | `base.json` (NodeNext, ES2022, `noUncheckedIndexedAccess`), `nextjs.json`, `react-library.json` | `D:reference/packages/typescript-config.md` |
| `packages/semantic-release-config` | GitHub releases only; `security:` and `chore(deps):` commits produce a patch release | `D:reference/packages/semantic-release-config.md` |
| `qa/tests/playwright` (`@repo/tests-playwright`) | E2E smoke/mock, axe, SEO, visual, LHCI, k6 | `D:QA/playwright/index.md` |

`packages/prettier-config` and `packages/strapi-plugin-tiptap-editor` are empty placeholders (`D:reference/packages/overview.md`).

**Turborepo task graph** (`U:turbo.json`):

- `build` and `build:static` depend on `^build`. They output `.next/**` (excluding the cache), `dist/**`, `public/**` and `out/**`.
- `dev` depends on `@repo/shared-data#build`, `@repo/design-system#build` and `@repo/logging#build`. It is uncached and persistent.
- `lint`, `lint:fix` and `typecheck` depend on their `^` counterparts. `test` depends on `^build` and is cached.
- Uncached tasks: `sync-types`, `generate:types`, `seed:*`, `run:db`, `run:imgproxy`, `transfer`, and every Playwright, LHCI and k6 task. `k6-load-test` passes `LOAD_*` through.
- `globalEnv` lists about 50 variables, among them `STRAPI_URL`, `STRAPI_REST_READONLY_API_KEY`, `BETTER_AUTH_SECRET`, `STRAPI_REVALIDATE_SECRET`, the Azure `AZURE_*` and `IDENTITY_*` vars, and `QA_GROUPS`. `globalDependencies` covers `**/.env` and `**/.env.*local`.
- The docs page says `dev` depends on shared-data and design-system only, which omits logging (`D:reference/packages/overview.md`).

**How the UI talks to Strapi:**

- **Two clients, server-side.**
  - `PublicStrapiClient` authenticates with the application API token `STRAPI_REST_READONLY_API_KEY`. Writes use `STRAPI_REST_CUSTOM_API_KEY`.
  - `PrivateStrapiClient` uses the end user's Strapi JWT from the Better Auth session. Reading that session forces dynamic rendering. `omitUserAuthorization: true` skips it.

  Both live in `apps/ui/src/lib/strapi-api/{base,public,private,request-auth}.ts` (`D:ui/strapi-api-client.md`, `D:ui/project-structure.md`).
- **Browser access goes through proxies.** `/api/public-proxy/[...slug]` and `/api/private-proxy/[...slug]` hide `STRAPI_URL` and the tokens, and enforce `ALLOWED_STRAPI_ENDPOINTS` per HTTP method in `request-auth.ts`. Calls pass `{ useProxy: true }` (`D:ui/built-in-api-routes/public-proxy.md`, `private-proxy.md`). `/api/asset/[...slug]` proxies `uploads/` only (`D:ui/built-in-api-routes/asset.md`).
- **Endpoints are a map.** `API_ENDPOINTS: Partial<Record<UID.ContentType,string>>` in `base.ts`. A missing entry throws `Endpoint for UID ... not found` (`D:getting-started/add-content-type.md`).
- **App-level fetchers** live in `lib/strapi-api/content/server.ts` and `content/client.ts` (`D:ui/project-structure.md`).
- **Environment variables.** The UI reads `APP_PUBLIC_URL`, `STRAPI_URL`, the two API keys, `STRAPI_PREVIEW_SECRET`, `BETTER_AUTH_SECRET`, `STRAPI_REVALIDATE_SECRET` and `STRAPI_CDN_PURGE_SECRET`. All are optional in `src/env.mjs` (t3-env), and code should read them through `getEnvVar()`. Strapi reads `CLIENT_URL`, which must point at the UI (`D:ui/environment-variables.md`, `D:reference/cache-revalidation.md`).
- **CSR env injection.** An allowlist (`CSR_ENVs` in `[locale]/layout.tsx`) is serialised to `window.CSR_CONFIG`. The docs say never to put secrets there (`D:ui/environment-variables.md`).

**Generated types:**

- `strapi ts:generate-types` writes `apps/strapi/types/generated`. `packages/strapi-types/generated` is a committed symlink to `../../apps/strapi/types/generated`. A copy fallback (`sync-types`) exists for Windows (`D:reference/packages/strapi-types.md`, `U:packages/strapi-types/package.json`).
- `U:CLAUDE.md` says the types regenerate automatically when Strapi restarts. `D:reference/commands.md` still says to run `generate:types` and then `sync-types` after any schema change. The two disagree.

## B. Versions and pins

| Item | Upstream v3.6.1 | Fork (2026-10-04) | Source |
|---|---|---|---|
| Node | `engines ^26.0.0` in every package; `.nvmrc 26` | `^24.0.0`; `.nvmrc 24` | `U:package.json`, `F:package.json` |
| pnpm | `packageManager pnpm@12.18.0` | `pnpm@11.21.0+sha512...` | same |
| turbo | 2.11.11 | 2.9.18 | same |
| Next | 16.4.6 | 16.3.6 | `*/apps/ui/package.json` |
| React (UI) | 19.3.1 | 19.2.7 | same |
| Strapi | 5.62.0 (React 18.3.1 in admin) | 5.48.1 | `*/apps/strapi/package.json` |
| better-auth | 1.7.24 | 1.6.22 | UI package.json |
| zod (UI and Strapi) | 4.6.7 | 4.4.3 | both package.json |
| TypeScript | 6.0.3 | 6.0.3 | both |
| ESLint | 10.14.0 | 9.39.4 | root package.json |
| vitest | 5.1.0 | 4.1.11 | apps |
| @sentry/nextjs | 11.12.0 | 10.58.0 | UI package.json |
| ckeditor5 | 48.5.3 | 48.4.0 | Strapi package.json |
| semantic-release | 25.0.9 | 24.2.9 | root |
| minimumReleaseAge | 2880 (2 days) | 4320 (3 days) | `*/pnpm-workspace.yaml` |

**Upstream `pnpm-workspace.yaml`** (`U:pnpm-workspace.yaml`):

- `allowBuilds`: `@parcel/watcher`, `@sentry/cli`, `@swc/core`, `core-js`, `core-js-pure`, `esbuild`, `lefthook`, `protobufjs`, `sharp`, `unrs-resolver`.
- `minimumReleaseAge: 2880`, `minimumReleaseAgeExclude: []`, `resolutionMode: highest`.
- Dependabot security updates bypass `minimumReleaseAge`, so their PRs fail CI until the new versions are two days old. The fix is to re-run CI then (`D:reference/packages/overview.md`, PR#480).

**Every upstream override, with its stated reason:**

- `@types/react` / `@types/react-dom` 19.3.0: one copy of the React 19 types. Strapi and Docusaurus run React 18 but share the UI's types.
- `@codemirror/state` 6.7.6 and `@codemirror/view` 6.43.15: two loaded copies break CodeMirror in the Strapi admin editors.
- `@opentelemetry/api` 1.9.1: the OTel SDK 2.x line (pulled in by Sentry, Azure Monitor and @repo/logging) peers `<1.10.0`, but `^1.9` ranges float to 1.10.
- `mermaid` 11.17.2: holds 11.x until Docusaurus moves to 12, which is breaking. This version also fixes the 11.15 advisories.
- Security floors. Each uses a `<fixed` selector, so it lifts only vulnerable copies and never pulls a newer pin down. Drop each entry once its parent ships a patched pin.

  | Selector | Target | Parent and advisory |
  |---|---|---|
  | `ckeditor5@<48.5.1` | 48.5.3 | `@_sh/strapi-plugin-ckeditor` 8.0.0 pins `~48.4.0`; GHSA-rh54-vffm-5fvp (XSS) |
  | `dompurify@<3.4.17` | 3.4.17 | the same plugin pins 3.4.12; upstream's comment says one critical and one high, but GitHub's advisory database lists 4 low and 1 medium for 3.4.12 (checked 2026-11-27) |
  | `lodash@<4.18.1` | 4.18.1 | via the tiptap plugin, then `@strapi/design-system` 2.2.0 |
  | `zod@>=4.0.0 <4.6.6` | 4.6.7 | the AI SDK under the content-type-builder; Strapi's zod 3.25 has no patched 3.x |
  | `happy-dom@<21.0.4` | 21.0.4 | `@tiptap/html` and vitest; host code execution and SSRF |
  | `tinypool@<2.1.2` | 2.2.0 | `@docusaurus/core`; prototype pollution to RCE (critical) |
  | `adm-zip@<0.6.1` | 0.6.1 | `strapi-plugin-config-sync`; 5 high |
  | `axios@<0.33.0` | 0.35.0 | `get-sitemap-links` in the QA suite; 10 high |
  | `basic-ftp@<6.2.4` | 6.2.6 | `get-uri` via Lighthouse CI |
  | `serialize-javascript@<7.1.3` | 7.1.4 | webpack plugins in the docs build; RCE |
  | `@opentelemetry/instrumentation-http@>=0.204.0 <0.222.0` | 0.222.0 | `@azure/monitor-opentelemetry` |
  | `glob@>=9.0.0 <14.0.2` | 14.0.6 | several parents |
  | `minimatch@>=7.0.0 <11.0.1` | 11.0.8 | several parents |
  | `uuid@<11.1.1` | 11.1.1 | `sockjs` |
  | `katex@<0.18.2` | 0.18.11 | `mermaid` |

- The file also has `packageExtensions` (a zod peer for `@hookform/resolvers`, optional CodeMirror peers) and `peerDependencyRules.allowedVersions` (eslint `^10`, react `>=18 <20`, typescript `>=5.4 <6`, zod `>=3.25.67 <5`).
- Advisories left open after #492: zod 3.25.76 (no patched 3.x, and the path is not reachable), plus three others (PR#492). After #480 the count of known advisories dropped from 235 to 46 (PR#480).

**The fork's overrides are a different philosophy** (`F:pnpm-workspace.yaml`):

- They pin exact versions: "lowest version with no known advisory", for example `tar 7.5.21`, `undici@7`, `vite@7`, `happy-dom 20.8.9`, `lodash-es 4.18.1`.
- They pin the whole `@codemirror/*` family (#248) and add `@strapi/typescript-utils>prettier: $prettier` (#61).
- `minimumReleaseAgeExclude` holds two entries.
- The fork does **not** have upstream's `ckeditor5`, `dompurify`, `zod` or `lodash` floors, and its `happy-dom` pin sits inside the vulnerable range upstream names.

**Corepack.** Node 25 and later no longer bundle Corepack, so install pnpm once per Node version: `npm install -g pnpm@12.18.0` after `nvm use` (`D:getting-started/installation.md`). The Dockerfiles and the Azure DevOps step now run `npm install -g pnpm@...`. Images moved to `node:26-slim` / `node:26-alpine`. Node 26 has been "Active LTS since 2026-10-28". `pnpm/action-setup` moved to v6.1.1, pinned by SHA. pnpm 12 adds a first YAML document (`packageManagerDependencies`) to the lockfile. Node 26's `fetch` uses HTTP/2 by default, and `VERCEL_FETCH_DISABLE_H2=1` reverts it (all PR#480).

**Majors upstream did not take:**

- TypeScript 7, because typescript-eslint peers `<6.1.0`.
- React 19 or react-router 7 in Strapi.
- ckeditor5 49.
- mermaid 12.

All from PR#480.

## C. Setup and daily workflow

**Install and environment files:**

- `nvm use`, then `npm i -g pnpm@12.18.0`, then `pnpm install` (`D:getting-started/installation.md`).
- `preinstall` runs `npx only-allow pnpm`.
- `postinstall` runs `setup:apps`. That is `find . -name '*.example' -exec cp -n ...`, so it creates `apps/strapi/.env` and `apps/ui/.env.local` without overwriting existing files.
- `prepare` runs `lefthook install --reset-hooks-path`, but only inside a git worktree (`U:package.json`).
- Don't leave empty `VAR=` lines in a `.env` file: they count as set and defeat config fallbacks (`D:strapi/environment-variables.md`, `D:ui/environment-variables.md`).

**First run:**

- `pnpm dev:strapi` starts Postgres with `docker compose up -d db`. It then runs `scripts/seed-runner.mjs`, which auto-imports the newest seed when Page, Navbar or Footer content is missing, and starts Strapi on 1337.
- Regenerate the seeded **Read Only** API token in the admin and put it in `apps/ui/.env.local`, then run `pnpm dev:ui` (port 3000).
- Locales are `en` (default, no prefix) and `cs` (`D:getting-started/quick-start.md`).
- `pnpm run:imgproxy` starts a local imgproxy, after which you set `IMGPROXY_URL=http://localhost:8080` (`D:ui/images.md`).

**Commands** (`U:package.json`, `D:reference/commands.md`):

- `dev`, `dev:{strapi,ui,docs}`, `build`, `build:{strapi,ui,ui:static,docs}`, `start:*`, `lint`, `lint:fix`, `format`, `format:check`, `typecheck`, `typecheck:{ui,strapi}`.
- `test`, `test:ci`, `test:{ui,strapi}`, `generate:types`, `sync-types`, `seed:{check,import,export}`, `transfer:strapi`.
- `tests:playwright:*`, `tests:lhci:perfo`, `tests:k6:load:{smoke,average,spike,breakpoint}`.
- `worktree:{create,setup,cleanup}`, `commit`.
- Cleanup scripts live in `scripts/utils/rm-*.sh`. Everything runs from the repo root; the docs say never `cd` into an app.

**`pnpm verify` does not exist upstream.** In the fork it is `turbo run lint typecheck test types:check && check-knowledge-contract.sh && check-vendored-skill-integrity.sh && check-border-utilities.sh && check-fixture-git-writes.sh`. `verify:full` adds `test:scripts`, the shell suite, which takes about 2h40m on Windows (`F:package.json`, `F:CLAUDE.md`).

**Worktree toolkit:**

- `scripts/worktree/{create,setup,cleanup,detect-root}.sh` and `lib/manifest.sh`, driven by `worktree.config.json`.
- The manifest copies `apps/strapi/.env`, `apps/ui/.env.local` and `.env`. Its post-setup step is `pnpm install --frozen-lockfile --prefer-offline` followed by building shared-data, design-system and logging.
- Default base is `dev`, falling back to `main`. New worktrees land in `<root>/.worktrees/<slug>`; nesting is refused. `cleanup` refuses unmerged branches without `--force`. Requires `jq` (`D:reference/commands.md`, `U:worktree.config.json`).
- The fork's manifest adds `symlink: apps/strapi/public/uploads`, `clearOnReuse`, `devServers` with health checks, and `preview` port bands (`F:worktree.config.json`).

**Git hooks** (`U:lefthook.yml`, `D:reference/workflow.md`):

- `pre-commit` validates the branch name and runs lint-staged (ESLint and Prettier). `commit-msg` runs commitlint (`config-conventional` plus `config-pnpm-scopes`) (`U:commitlint.config.js`).
- Branches must match `<type>/STAR-<n>-<desc>`. Exempt: `main`, `master`, `develop`, `dev`, `release/*`, `hotfix/*`. Allowed types: build, chore, ci, docs, feat, fix, perf, refactor, revert, style, test.
- The fork adds three `pre-push` jobs: a git-config integrity check, a fixture-identity check on commits, and the shell suite for changed scripts (`F:lefthook.yml`).

**Commits and releases:**

- Conventional Commits; `pnpm commit` runs Commitizen.
- Mention new env vars in the commit body as `env.VAR` (`U:CLAUDE.md`).
- Branch flow: feature branch to `dev`. Auto PR keeps a `dev` to `main` PR open, and it must merge with a merge commit.
- Pushing to `main` runs semantic-release, which creates a GitHub release. There is no npm publish (`U:.github/workflows/auto-pr.yml`, `release.yml`, `D:reference/packages/semantic-release-config.md`).

## D. CI/CD

**Upstream workflows** (`U:.github/workflows/*.yml`; every job uses `./.github/actions/setup-pnpm`, which runs pnpm/action-setup v6.1.1 by SHA, then setup-node from `.nvmrc` with a pnpm cache, then `pnpm install --frozen-lockfile --prefer-offline`):

| Workflow | Trigger | What it runs | What it gates |
|---|---|---|---|
| `ci.yml` "CI", job "Install, Lint, Test and Build" | PR to `main` or `dev` | Copies the example env files, then `pnpm lint`, `format:check`, `test:ci`, `build:ui`, `build:strapi`. Sets `CI=true` and `NPM_CONFIG_IGNORE_SCRIPTS=true`, cancels in-flight runs, 10-minute timeout. Static export is commented out. | The required status check on `main` |
| `leak-guard.yml` | Push to any branch; PRs | Greps `git ls-files` against secret `PRIVATE_PATHS_REGEX` and prints only the count. Fails closed if the secret is missing. Runs only when `github.repository == notum-cz/...`, and skips fork PRs. | Accidental private paths in the public repo (#487) |
| `qa.yml` | `workflow_dispatch` only (cron commented out) | Separate jobs for e2e, axe, seo, visual (Docker, needs a baseline) and lhci_perfo, each behind its own checkbox. Inputs: `base_url` (falls back to `vars.BASE_URL`) and `groups` (exported as `QA_GROUPS`). LHCI opens a PR updating `lighthouse-history.md` with `LEFTHOOK=0`. | Nothing automatically |
| `docs.yml` | Push to `main` touching `apps/docs/**`, or manual | Docusaurus build, then deploy to GitHub Pages. Upstream repo only. | none |
| `release.yml` | Push to `main` | `semantic-release --extends @repo/semantic-release-config`. Upstream repo only. | none |
| `auto-pr.yml` | Push to `dev`, daily 09:00 UTC, or manual | Creates or updates the `dev` to `main` PR. The body includes deploy notes (migrations, schema, dependency or CI changes), env vars diffed from `*.env.example`, the areas changed, and commits grouped by type. | none |

- **Required checks** (`gh api repos/notum-cz/.../rules/branches/main`):
  - Status check "Install, Lint, Test and Build" (non-strict).
  - 1 approving review and resolved review threads.
  - Allowed merge methods: `merge` only.
  - CodeQL (alerts high or above), code quality (errors), no deletion, no force-push.
- Upstream also has `.azuredevops/pipelines/qa.yml` and `.azuredevops/templates/steps/setup-pnpm.yaml`, an Azure DevOps mirror of QA (`U:` tree, `D:QA/playwright/index.md`).
- **Dependabot** now uses a single npm entry with `directory: "/"`. Subdirectory jobs never updated the lockfile, and Dependabot reads its config only from `main` (PR#480).

**Documented deploy targets:**

- **Heroku** (`D:reference/deployment/heroku.md`):
  - Two apps on the heroku-24 stack, with Notum buildpacks: Turbo Prune, then Node.js, then (UI only) Next Standalone Slim.
  - Config vars: `APP` and `WORKSPACE`; the UI also needs `NEXT_OUTPUT=standalone`. Heroku Postgres supplies `DATABASE_URL`.
  - The Procfile is `web: cd apps/strapi && node scripts/seed-runner.mjs start`. Use external storage for uploads.
  - The helper scripts hard-code `TURBO_VERSION=2.9.18` and say it "must match" the monorepo, but the root uses turbo 2.11.11. The docs are stale here.
- **Vercel** (`D:reference/deployment/vercel.md`): UI only, root directory `apps/ui`, and `NEXT_OUTPUT` must be left unset. Strapi is explicitly not supported on Vercel.
- **Docker** (`D:ui/docker-build.md`, `D:strapi/docker-build.md`):
  - `apps/ui/Dockerfile` builds standalone from the repo root. Build once and inject env at runtime, or pass build args per environment (this bakes in the read-only key).
  - `apps/strapi/Dockerfile` uses the turbo prune pattern. There is no production compose file, and the docs expect Postgres to be separate.
- **Azure:** there is no deploy page. Azure appears only as integrations:
  - Front Door CDN purge via the Container App managed identity (`D:reference/integrations/cdn.md`).
  - Blob upload provider, with MSI supported (`D:strapi/plugins/upload-providers.md`).
  - Application Insights (`D:reference/integrations/logging.md`).
  - An App Service proxy-trust note (`D:auth/strapi-admin/microsoft-sso.md`).

  Azure Container Apps as the intended host is MY-INFERENCE from `IDENTITY_ENDPOINT`.
- **GitHub Pages** hosts the docs site (`docs.yml`).

**The fork's own pipeline** (`F:.github/workflows/*`):

- **`ci.yml`, job "Verify".** It runs on non-draft PRs. Steps:
  - branch-name check
  - commitlint over the PR range
  - `validate-config-sync.sh`
  - commit-identity check
  - `pnpm verify:full`, then `format:check`, then `build:strapi`
  - a Playwright admin-boot smoke test
  - an `origin-guard` test
  - a label-gated `preview-qa` job
- **`deploy.yml`.** Staging deploys on push to `main`; live deploys on `release: published`. Both run `scripts/deploy/remote-deploy.sh` over SSH to Hostinger.
- **Other workflows.** `preview-ci-spike.yml` (manual) plus `qa.yml`, `release.yml` and `auto-pr.yml` copied from v3.4.1-era upstream. There is no `docs.yml` and no `leak-guard.yml`.
- **Required checks:** "Verify" and "Preview QA (axe, seo, visual)", enforced for non-admins (`gh api repos/Herman-Adu/notum-starter-testbed/branches/main`).
- **The Hostinger topology:** one VPS running two full stacks (Postgres, Strapi, UI, imgproxy), one per environment, behind a shared Caddy. Compose lives in `docker/production/`. Setup is by hand by design (`FD:reference/deployment/hostinger-vps.md`).

## E. Strapi conventions

- **Content types.** Collections live at `apps/strapi/src/api/<name>/content-types/<name>/schema.json`, with factory router, controller and service. A UI that only reads needs no permission changes: the Read Only token covers `find`/`findOne` on every type. Writes need the Custom token. Per-user access needs the Authenticated role. Permissions live in the DB and travel with the seed (`D:getting-started/add-content-type.md`).
- **Components.** UIDs follow `{category}.{kebab}` (for example `sections.hero`), with file `src/components/<cat>/<name>.json` and collectionName `components_{cat}_{name}`. The UID must match in four places: the schema path, the page dynamic zone, the population rules, and the UI registry (`D:strapi/strapi-schemas.md`).
- **Page builder:**
  - `api::page.page` has a `content` dynamic zone. The UI renders it with `StrapiPageView`, then `StrapiDynamicZoneRenderer`, then the `PageContentComponents` registry, matching on `__component`.
  - Each item gets an error boundary, an anchor id (`a-faq`, `a-faq-2`), and a fallback for unknown UIDs (`D:page-builder/introduction.md`).
  - New sections are meant to go through the skills: find-component, copy-component, create-content-component.
- **Population.** The `@notum-cz/strapi-plugin-smart-populate` plugin expands a `"smart"` token from the schemas at bootstrap. `populateOverrides` in `config/plugins/smart-populate.ts` handle relation-specific shapes (`D:strapi/plugins/smart-populate.md`).
- **Hierarchy and redirects:**
  - `fullPath` is chained from parent slugs; slugs match `[a-z0-9/-]`. Renaming a published page leaves `fullPath` stale until "Update hierarchy" runs in the Hierarchy single type.
  - That step creates locale-prefixed `api::redirect.redirect` entries, compacted so there are no chains or loops, and revalidates in a batch (`D:page-builder/pages-hierarchy.md`, `D:strapi/cms-redirects.md`).
  - Redirects are always 307, applied by the UI proxy with a 2-minute in-memory TTL per instance (`D:ui/next-proxies.md`).
- **Localization.** Fields carry `pluginOptions.i18n.localized: true`, and the locale is forwarded as `?locale=`. Each locale has its own slug, parent and fullPath (`D:reference/internationalization.md`).
- **Document middlewares are preferred over lifecycles.** They live in `src/documentMiddlewares` and are registered in `bootstrap()`. Lifecycles fire `afterCreate` on every publish under Draft & Publish, and their exceptions roll back the transaction (`D:strapi/strapi-schemas.md`).
- **Revalidation.**
  - The flow is document middleware, then `api::revalidate.revalidate`, then `POST /api/strapi-revalidate`, authenticated with `Bearer STRAPI_REVALIDATE_SECRET` and compared in constant time.
  - Pages and redirects revalidate by path; navbar and footer by tag `strapi:<uid>`. The allowlist is `REVALIDATE_COLLECTIONS`.
  - Fallback windows: 300s for the route, 120s for `fetchPage`, 60s for the client, 600s for navbar and footer (`D:reference/cache-revalidation.md`).
- **Seeding:**
  - Exports go to `apps/strapi/seed/exports/strapi-export-YYYY-MM-DD-HHmmss.tar.gz`, and the newest one wins. `seed:export` keeps 5. The scripts need bash.
  - `AUTO_SEED_ENABLED` defaults to true for develop and false for start. `AUTO_SEED_MODE` is one of `empty`, `prompt`, `force` or `skip`.
  - An import overwrites existing data (`D:strapi/data-seeding.md`).
- **Schema checks.**
  - The `strapi-schema-check` skill and `.claude/skills/strapi-schema-check/scripts/check.sh` compare `schema.json` against the base branch and flag renames, deletes, type changes and tightened constraints. They look for a matching migration under `apps/strapi/database/migrations/`.
  - Exit codes: 0 = no risky changes; 1 = risky changes with no migration (block); 2 = risky changes with a matching migration (warn only); 3 = the check itself failed.
  - The skill auto-loads on schema edits through `paths:` (`U:.claude/skills/strapi-schema-check/*`).
  - The fork adds `types:check` (drift between schema and types) and `config:check` (`F:package.json`).
- **Data import, export and config:**
  - `pnpm transfer:strapi` runs `strapi transfer`. `config:dump` / `config:restore` dump to `dump.json`.
  - `strapi-plugin-config-sync` keeps roles and permissions in `config/sync/` (`D:reference/commands.md`, `D:strapi/plugins/config-sync.md`).
  - API-token permissions cannot be synced across environments (`D:ui/environment-variables.md`).
- **Other Strapi features:**
  - Strapi MCP at `/mcp`: on in development, off elsewhere, toggled by `STRAPI_MCP_ENABLED` (`D:reference/AI/strapi-mcp.md`).
  - Cron is off by default (`CRON_ENABLED`) and runs once per replica, so use a single scheduler replica (`D:strapi/cron-jobs.md`).
  - Users-permissions JWT lasts 30 days, matching the Better Auth `maxAge` (`D:strapi/plugins/users-permissions.md`).
  - Upload provider priority: Azure, then S3, then local. Email: Mailgun, then Mailtrap.
  - Microsoft SSO for the admin needs an Enterprise licence (`D:auth/strapi-admin/microsoft-sso.md`).

## F. Frontend conventions

- **Structure** under `apps/ui/src`:
  - `app` holds routes, with page-local `_components`.
  - `components/{elementary,forms,page-builder,providers,typography,ui(shadcn)}`.
  - `hooks`.
  - `lib/{logging,metadata,proxies,strapi-api,telemetry}`.
  - `types`, plus `../locales`.

  `ExtendedPageProps<route>` types the page props. `typecheck` runs `next typegen` before `tsc` (`D:ui/project-structure.md`, `U:apps/ui/package.json`).
- **Routes:**
  - The static catch-all `[locale]/[[...rest]]` uses `force-static`, `dynamicParams` and `revalidate=300`.
  - Requests with search params are rewritten to `[locale]/dynamic/[[...rest]]`, which is `force-dynamic` (`D:ui/caching.md`, `D:ui/next-proxies.md`).
  - Static export is not supported out of the box (`D:ui/caching.md`).
- **The proxy chain** in `src/proxy.ts` runs basicAuth, httpsRedirect, redirects, authGuard and dynamicRewrite in that order, then next-intl. Every response goes through `withSecurityHeaders`:
  - Static HSTS, nosniff, Referrer-Policy and Permissions-Policy are set in `next.config.mjs`.
  - The runtime CSP (`frame-ancestors 'none'`, widened only for the preview cookie) and `X-Frame-Options` are set in the proxy.

  Source: `D:ui/next-proxies.md`.
- **Auth.** Better Auth owns the session cookie, and Strapi users-permissions issues the JWT, stored as `session.user.strapiJWT`.
  - Three custom plugins:
    - `strapiAuthPlugin` adds the `/api/auth/{sign-in,register,forgot-password,reset-password,update-password}-strapi` endpoints.
    - `strapiSessionPlugin` calls `/users/me` on every session access and clears the session if the JWT is invalid or the user is blocked.
    - `strapiOAuthPlugin` adds `sync-oauth-strapi`.
  - OAuth goes through Strapi's `/api/connect/<provider>`, then the UI callback `/auth/strapi-oauth/[provider]` (`D:auth/ui/authentication.md`, `D:auth/ui/oauth-providers.md`).
  - The docs include a checklist for removing auth entirely (`D:how-to/index.md`).
- **Design system:**
  - `packages/design-system/src/styles/{colors,theme,typography,shared}.css` plus `fonts.css` (local Roboto). `globals.css` imports `@repo/design-system/source-styles.css`; the Strapi admin imports the compiled `styles.css`.
  - CKEditor and TipTap configs are generated JSON and CSS.
  - `.typo-*` utilities are defined with `@utility` and mapped in `components/typography/config.ts`. Colours default to OKLCH.
  - Pick one rich-text editor (`D:design-system/*`).
- **Caching** (`D:ui/caching.md`):
  - The client defaults to `revalidate: 60` in production and 0 in development; override with `requestInit.next.revalidate`.
  - `revalidate` also drives the HTTP headers a CDN obeys. Preview responses get `private, no-store`, and a CDN needs a bypass rule for the preview cookie (`D:ui/next-proxies.md`).
  - CDN purge is opt-in and inert unless a provider's vars are set (`D:reference/integrations/cdn.md`).
- **Images:**
  - `StrapiBasicImage` uses imgproxy when `IMGPROXY_URL` is set, otherwise an unoptimized direct URL. `StaticImage` uses Next's Sharp optimizer.
  - Do not set `images.unoptimized` globally.
  - `STRAPI_URL` must use the same host you browse on (`localhost` and `127.0.0.1` are different origins) (`D:ui/images.md`).
- **SEO** (`D:ui/seo.md`):
  - `getMetadataFromStrapi()` takes a non-localized SEO Configuration single type (`globalMetadata`, `robotsConfiguration`).
  - Canonical and hreflang URLs are built from `APP_PUBLIC_URL`. JSON-LD comes from `seo.structuredData`.
  - Sitemap and robots are only open in production; robots return `Disallow: /` outside it.
  - Unset fields are omitted rather than filled with placeholders.
- **Testing:**
  - Vitest: `apps/ui/src/**/*.test.ts` and `apps/strapi/tests` (`D:QA/unit-testing.md`).
  - Playwright suites: e2e smoke (real backend) and mock (`page.route`), axe with per-page `warningRuleIds`, SEO, visual (only `*-linux-*.png` committed; baselines generated in Docker; WebKit excluded on Linux), and LHCI with a committed `lighthouse-history.md`.
  - Test groups are tagged with `tags("homepage")`. `@no-prod` is inverted on production, and the environment is derived from the `BASE_URL` hostname (`D:QA/playwright/index.md`).
  - Page objects contain no `expect()` (`D:QA/playwright/pom-and-test-types.md`).
  - k6 load tests: one TypeScript file, `qa/tests/playwright/load/load-test.ts`. Profiles: smoke, average, spike and breakpoint. Thresholds: p95 under 1500 ms, errors under 1%, checks over 99%, zero dropped iterations. Production is refused unless `LOAD_ALLOW_PROD=true` (`D:QA/playwright/load-testing.md`).
  - Gherkin test-case pages carry a localStorage checklist, but no runner executes them (`D:QA/test-cases/index.md`).

## G. Agent tooling in the starter

- **Layout.** `.claude/skills/` is the source of truth. `.agents/skills -> ../.claude/skills` is a committed symlink for agentskills.io agents (Codex, Copilot CLI, Gemini). `AGENTS.md` is a symlink to `CLAUDE.md` at the root, in `apps/ui` and in `apps/strapi`.
- **Vendored skills** are installed with `skills.sh` and tracked in `skills-lock.json` with a source and content hash: find-skills (`vercel-labs/skills`), frontend-design (`anthropics/skills`), next-best-practices (`vercel/nextjs-skills`), vercel-react-best-practices (`vercel-labs/agent-skills`) (`U:CLAUDE.md`, `U:skills-lock.json`, `U:.claude/skills/README.md`).
- **On Windows** the `.agents/skills` symlink needs `git config core.symlinks true` and Developer Mode (`U:.claude/skills/README.md`).
- **The 25 skills at v3.6.1**, from the `U:` tree and `D:reference/AI/skills/overview.md`:
  - Stack-coupled: add-content-type, add-locale, add-ui-component, create-content-component, copy-component, find-component, consolidate-patterns, seed-content, strapi-schema-check, remove-sentry, remove-azure-monitor, remove-cache-revalidation, remove-cdn-purge.
  - Stack-agnostic: start-work, make-pr (default target `dev`), review-pr, resolve-review-suggestions, validate-branch-refs, write-tests, write-test-cases, write-qa-notes.
  - Vendored: find-skills, frontend-design, next-best-practices, vercel-react-best-practices.
- **Workflow spine** from the overview: `/start-work`, then build (copy-component, find-component, create-content-component or add-content-type, with strapi-schema-check as the gate), then `/write-tests`, `/review-pr`, `/make-pr`, then `/resolve-review-suggestions`.
- **The authoring guide:**
  - The `description` should lead with "Use when…" and should not summarise the workflow.
  - Side-effecting skills get `disable-model-invocation: true`. `paths:` makes a skill auto-load on matching edits.
  - Bundled scripts assume the repo root as the working directory.

  Source: `U:.claude/skills/README.md`.
- **CLAUDE.md** covers the workspace table, essential commands, generated types, docs routing, Conventional Commits with `env.VAR`, and the skills layout (`U:CLAUDE.md`).
- **#319 "port agent skills + worktree scripts toolkit"** (merged 2026-06-24, closes #284) introduced:
  - the `.claude/skills` source of truth and the symlink
  - 22 skills
  - the `docs/reference/AI` pages
  - the `worktree:*` scripts
  - Strapi MCP on by default through `STRAPI_MCP_ENABLED`

  Source: PR#319. Since then copy-component, write-test-cases and write-qa-notes have been added (the `U:` tree).
- **The fork's skills directory** (`F:.claude/skills`, from a directory listing) has about 49 entries. It keeps most upstream stack-coupled skills and adds:
  - the Matt Pocock set: wayfinder, to-spec, to-tickets, implement, tdd, grill-*, code-review, domain-modeling, research and others
  - `finish-work`, `testing-conventions` and Hostinger's `vps`

  It has no `copy-component`, `review-pr`, `write-tests`, `write-test-cases` or `write-qa-notes`.

  The fork's `CLAUDE.md` defines a nine-station spine: wayfinder, to-spec, to-tickets, start-work, implement, `pnpm verify`, code-review, make-pr (draft), finish-work (`F:CLAUDE.md`).

## H. Fork vs upstream

**Sync point.** The fork's history contains upstream commits up to `5778c3b3` "Merge pull request #349 from notum-cz/dev" (2026-06-24), which is **v3.4.1** (`gh api .../commits/v3.4.1`). After that, every commit is the fork's own, numbered #1 to #454 in the fork's tracker (`git log`). It is a separate repository history, not a merge-tracking fork. MY-INFERENCE: syncing means cherry-picking or porting, not `git merge upstream/main`, because 656 diverged commits sit on top of v3.4.1.

**Version deltas:** see the table in B.

**Pages only in the fork (11)**, from `FD:`:

| Page | What it covers |
|---|---|
| `reference/deployment/hostinger-vps.md` | VPS provisioning runbook |
| `reference/deployment/preview-environment.md` | Per-worktree Compose stack behind Caddy; `preview:up/status/down` |
| `reference/deployment/docs-container.md` | Static docs served by Caddy on port 3301; the image builds on `node:24-slim` |
| `reference/deployment/dependabot.md` | A 751-line write-up of the alert backlog and the override methodology |
| `strapi/admin-roles.md` | Editor/Author grants by content-type kind, with `admin::is-creator` |
| `reference/testing/{overview,playwright,shell-scripts,unit-testing}.md` | Includes admin-boot smoke, origin-guard, and the `sh` harness |
| `reference/AI/skills/{finish-work,testing-conventions}.md` | Fork-only skills |

**Pages only upstream (15):**

- `QA/{overview,unit-testing}.md`
- `QA/common-knowledge/index.md`
- `QA/playwright/{index,ci-pipeline,load-testing,pom-and-test-types}.md`
- `QA/test-cases/{index,login,logout}.md`
- `reference/AI/skills/{copy-component,review-pr,write-qa-notes,write-test-cases,write-tests}.md`

Another 57 pages exist in both and differ. The largest differences are in `reference/commands.md`, `typography.md`, `reference/AI/skills/overview.md`, `github-actions.md` and `config-sync.md` (`diff` of the two trees).

**Deliberate fork divergences worth keeping in mind when syncing:**

- `sync-types` was removed (#155/#168). On Windows, `cp -r` followed the symlink and nested `generated/generated`. The fork says not to re-add it (`FD:reference/packages/strapi-types.md`).
- `setup:apps` became `scripts/setup-apps.mjs`, and `prepare` became `scripts/install-git-hooks.sh` (`F:package.json`).
- The axe task was renamed `axe-test`, and `tests:playwright:{smoke,origin-guard}` were added.

**Upstream commits since 2026-10-04 that touch versions, security or CI** (`gh api ".../commits?since=2026-10-04T00:00:00Z"`, 19 commits):

- `4d447ccd` #480 (2026-11-17): Node 26, pnpm 12, Next 16.4, Strapi 5.62, Sentry 11, ESLint 10, vitest 5, CKEditor 48.5.3, the override rewrite, the Dependabot root-only fix, and `--ignoreDeprecations 6.0` for Strapi's typecheck.
- `d4fe327e` #487: the leak guard; release and docs jobs restricted to the upstream repo.
- `9365b0be` #492: security overrides for tinypool, adm-zip, axios, basic-ftp, serialize-javascript, otel-http, glob, minimatch, uuid and katex.
- `2723a570` #491: removes the stale `apps/docs/pnpm-lock.yaml`, which accounted for 130 of 178 alerts (PR#492).
- `7a9f2ce4` #474: k6 load tests.
- `366e9cf8` #449: Playwright feature groups and environments.
- `2c01611b` #424: consolidated Dependabot updates.
- `c38208db` #484 and `51c1136a` #478: `peter-evans/create-pull-request` bumps.
- `c5c85028` #435: CodeRabbit config.
- `e36f87cb` #433: preview for unpublished pages.

**Relevant upstream commits between v3.4.1 and 2026-10-04 that the fork also lacks** (compare API):

- `18bddb17` #359: rate limiting on auth endpoints.
- `cb35ca63` #404: Next.js security release and Strapi 5.52.2.
- `f4413128`: Next 16.2.11.
- `ddd52325` #397: QA pipeline parity, the smoke/mock split, Gherkin docs.
- `68aee236` #426: the local Strapi host fix.
- `5bb56af0` #361: QA installs Chromium only.
- `fccc9e46` #403: a config-sync update.

## I. Conflicts with "frontend owns a Zod contract; Strapi implements it behind an adapter"

The starter couples the UI to Strapi-generated types by design.

1. **Props are CMS types.** Page-builder components take `component: Data.Component<"sections.hero">` from `@repo/strapi-types` (`D:page-builder/introduction.md`). The Showcase mocks use the same type (`D:ui/built-in-pages/showcase.md`). The features page sells this as "Typed rendering" (`D:getting-started/features.md`).
2. **The registry is keyed by Strapi UIDs.** `PageContentComponents: { [K in UID.Component]?: React.ComponentType<any> }`, matched on the CMS's `__component` discriminator (`D:page-builder/introduction.md`).
3. **The client's return types are Strapi's.** `fetchOne`, `fetchMany` and the others return `APIResponse<Result<TContentTypeUID, TParams>>`, imported from `@repo/strapi-types` (`U:apps/ui/src/lib/strapi-api/base.ts`, lines 1 and 121–271). `Result` wraps Strapi's `Modules.Documents.Result` and the smart-populate types (`U:packages/strapi-types/src/index.ts`).
4. **There is no runtime validation at the boundary.** `base.ts` imports no Zod and calls no `parse` (grep). A mismatch reaches the render, where per-component error boundaries contain it (`D:ui/error-handling.md`). The types docs admit "required" fields may be absent in responses (`D:reference/packages/strapi-types.md`).
5. **CMS query language lives in UI code.** `populate: { content: "smart" }`, `status: "draft"|"published"`, `filters: { slug: { $startsWith } }` and `locale` all appear at UI call sites and in `content/server.ts` (`D:ui/strapi-api-client.md`, `D:strapi/plugins/smart-populate.md`).
6. **Endpoint mapping is keyed by Strapi UID.** `API_ENDPOINTS: Partial<Record<UID.ContentType,string>>` (`D:ui/strapi-api-client.md`).
7. **The stated ownership is the reverse of the rule.** "Strapi owns page structure and content. The UI owns visual implementation" (`D:page-builder/introduction.md`). The design-system docs also say to "regenerate Strapi types so the UI receives the updated component shape" (`D:design-system/cms-and-components.md`). That is a schema-first flow, not contract-first.
8. **The fork goes further.** `types:check` gates drift between schema and types inside `pnpm verify` (`F:package.json`, `FD:reference/packages/strapi-types.md`).

**Compatible with the rule** (MY-INFERENCE):

- The BFF proxies, allowlist, `getEnvVar()`, revalidation, redirects and SEO plumbing are transport and infrastructure. They don't depend on the types.
- `PublicStrapiClient` can serve as the transport inside `source.strapi.ts`. The mapper there would `Schema.parse()` into adu-dev's contract.
- A page-builder registry keyed by a contract discriminator, rather than `UID.Component`, keeps the pattern without the coupling.

## Adopt / adapt / avoid for adu-dev

adu-dev today: a single Next 16.4.6 app on npm with `package-lock.json`. Node is `.nvmrc 24` with `engines >=20.9.0`, and zod resolves to 4.6.7. The Work contract lives at `src/features/*/lib/contract.ts`, with a Strapi schema at `cms/` (`adu-dev:package.json`, `.nvmrc`, `package-lock.json`, `CLAUDE.md`).

| Item | Verdict | Why / how |
|---|---|---|
| `apps/web`, `apps/strapi` (`cms/` promoted), `apps/docs`, `packages/*` layout under pnpm workspaces and Turborepo | **Adopt** | Matches upstream (`U:pnpm-workspace.yaml`, `U:turbo.json`). Moving from npm to pnpm is the actual migration, so decide it first. |
| Node and pnpm pins: `.nvmrc 26`, `engines ^26`, `packageManager pnpm@12.18.0` | **Adapt** | Upstream's current target (PR#480). adu-dev is on Node 24. Remember the Corepack note: run `npm i -g pnpm@x` per Node version. |
| `pnpm-workspace.yaml`: `minimumReleaseAge`, `allowBuilds`, `<fixed` overrides with advisory comments | **Adopt** | Low cost, explicit supply-chain policy (`U:pnpm-workspace.yaml`). |
| Composite `setup-pnpm` action, CI env `NPM_CONFIG_IGNORE_SCRIPTS`, concurrency cancel | **Adopt** | `U:.github/actions/setup-pnpm/action.yml`, `U:ci.yml`. Add `typecheck` to CI; upstream omits it. |
| Dependabot with a single root `directory: "/"` | **Adopt** | Subdirectory jobs never update the lockfile (PR#480). |
| Leak guard | **Adapt** | Useful only if a public mirror exists. Note that it fails closed without the secret (`U:leak-guard.yml`). |
| `@repo/shared-data`, `@repo/logging`, `@repo/typescript-config`, `@repo/eslint-config` | **Adapt** | Good seams. Keep adu-dev's `src/global` and `src/features` split inside `apps/web`. |
| `@repo/design-system` | **Adapt** | Move the brand tokens from `globals.css @theme` into a package only if Strapi admin or editors need them. Drop Roboto, CKEditor and TipTap if they aren't used. |
| `@repo/strapi-types` consumed by UI components | **Avoid** | Violates the contract rule (section I). If generated types are kept at all, import them only inside `source.strapi.ts` as the mapper's input type. |
| `PublicStrapiClient` and the proxy allowlist | **Adapt** | Use them as the transport inside the Strapi adapter. Parse into the Zod contract at the boundary. |
| Smart-populate `"smart"` tokens | **Adapt** | Fine inside the adapter. Never at a UI call site. |
| Document-middleware revalidation, bearer secret, constant-time compare, tag-plus-path strategy | **Adopt** | `D:reference/cache-revalidation.md`. It fits behind the adapter boundary. |
| Document middlewares over lifecycles; `strapi-schema-check` script | **Adopt** | They prevent the drop-and-create data loss that comes from renamed fields (`D:strapi/strapi-schemas.md`, `U:.claude/skills/strapi-schema-check`). |
| Seed export and runner (`AUTO_SEED_*`) | **Adapt** | Useful for the `CONTENT_SOURCE=strapi` dev loop. `CONTENT_SOURCE=local` must still work without it. |
| Security headers split, CSP derived from `STRAPI_URL`, preview `no-store` | **Adopt** | `D:ui/next-proxies.md`. |
| Better Auth and the Strapi JWT bridge | **Avoid** (for now) | No end-user auth in adu-dev's scope as I understand it (UNVERIFIED). Upstream ships a removal checklist (`D:how-to/index.md`). |
| Lefthook, commitlint, `STAR-` branch pattern | **Adapt** | Keep the hooks. Change the branch regex to adu-dev's issue numbering. |
| Auto PR `dev` to `main`, merge-commit only | **Avoid** unless a `dev` branch is introduced | Upstream assumes a `dev` branch (`U:auto-pr.yml`). |
| semantic-release (GitHub releases only) | **Adapt** | Optional. The `security:` patch rule is a nice touch. |
| Worktree manifest scripts | **Adapt** | adu-dev already uses worktrees. The fork's hardened version (`clearOnReuse`, health checks) is the more tested of the two. |
| Playwright QA groups, axe/SEO/visual, LHCI history, k6 | **Adapt** | k6 measures server load, not frame rate, so it does not test the 60fps mobile budget. Use LHCI and visual tests for scenes, and k6 only before a traffic event. |
| Heroku helper scripts | **Avoid** | Their `TURBO_VERSION` is stale (`D:reference/deployment/heroku.md`). |
| `sync-types` copy fallback | **Avoid** | The fork measured it corrupting the types on Windows (`FD:reference/packages/strapi-types.md`). |
| `.claude/skills` with an `.agents/skills` symlink and `AGENTS.md` symlink | **Adapt** | adu-dev already vendors skills with pins. Copy the `skills-lock.json` hash idea, and keep its own contract-aware skills. |

## Unverified / open

- **Coverage of my reading.**
  - Upstream: I read all 113 `.md` files under `D:` (there are no `.mdx`) in full, except 16 short AI-skill pages, where I read the lead paragraph only. They are about 1 KB each, and I read the catalog page in full.
  - Fork: I read only the 11 fork-only pages (heads), plus diffs of `strapi-types.md` and `installation.md`. The other 55 differing fork pages I did not read in full.
- **Places where the upstream docs disagree with the code:**
  1. `D:reference/workflow.md` and `D:reference/deployment/github-actions.md` say Auto PR extracts env vars from commit bodies under "Required Environment Variables". `U:auto-pr.yml` actually diffs `*.env.example` files, under the heading "Environmental Variables Changes".
  2. `D:QA/unit-testing.md` says `test:ci` covers "all apps except Strapi". `U:package.json` has `test:ci` = `turbo run test`, the same as `test`.
  3. `D:reference/commands.md` says to run `generate:types` and `sync-types` after any schema change. `U:CLAUDE.md` says types regenerate automatically, and the package is a symlink.
  4. `D:reference/deployment/github-actions.md` omits `leak-guard.yml`, and calls `base_url` "required" when it is optional with a fallback.
  5. The Heroku helpers set `TURBO_VERSION=2.9.18` while the root has turbo 2.11.11.
  6. `D:reference/packages/overview.md` says `dev` depends on two packages; it depends on three.
- **Strapi 5.62.0's undisclosed security fix.** The details are not public (PR#480).
- **Node 26 "Active LTS since 2026-10-28".** Stated in PR#480; I did not check nodejs.org.
- **Rate limiting in the fork.** I found none in `F:apps/strapi/config` (grep for `ratelimit`). It may live elsewhere. UNVERIFIED.
- **How the upstream UI uses zod** (env, forms, anything else). Not inspected; MY-INFERENCE says env (t3-env) and forms (`@hookform/resolvers`).
- **Azure as an intended deploy host** (Container Apps) is inferred from the env vars only. No page documents it.
- **adu-dev's need for auth, i18n or a `dev` branch.** Not established here, so the verdicts above depend on those answers.
