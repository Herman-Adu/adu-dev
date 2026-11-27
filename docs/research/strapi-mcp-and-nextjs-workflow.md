# Strapi 5 MCP and Next.js agent workflow: research

Researched 2026-11-27 from primary sources only: docs.strapi.io (and its source repo `strapi/documentation`), strapi.io blog, `strapi/strapi` source, and the third-party servers' own repos and npm registry entries. Nothing was cloned or run. Latest Strapi release at time of research: v5.64.0 (2026-11-25), `gh api repos/strapi/strapi/releases/latest`.

Labels: SOURCED = cited. MY-INFERENCE = reasoning from sources, not stated by them. UNVERIFIED = could not confirm.

## Bottom line

- The official Strapi MCP (`POST /mcp`, Admin API token) generates content-entry tools plus 10 media tools and a dev-only `log` tool. It has no schema or content-type tools, and I found no roadmap statement about adding them. Plugins can add their own tools, resources and prompts.
- Schema creation has two real paths: Strapi's Content-Type Builder admin routes, or hand-written `schema.json` / component JSON files. Only the first is restricted by Strapi: the routes refuse writes unless `autoReload === true` (SOURCED). Hand-written files load wherever Strapi starts, production included, because startup schema sync runs in every environment (section 3). Keeping file-based schema changes to development is this workflow's policy (MY-INFERENCE), not a guard Strapi provides.
- l33tdawg/strapi-mcp calls the Content-Type Builder admin routes with an admin JWT obtained from `POST /admin/login` using an email and password. It does not write files itself; Strapi does. Its `STRAPI_DEV_MODE` env var is only logged, never checked. The real gate is Strapi's own `autoReload` middleware.
- l33tdawg/strapi-mcp is stale (last commit 2025-07-25, v0.2.3, no npm provenance). It is MIT-licensed with 4 runtime deps. It ships `delete_content_type` with no confirmation guard, and logs request payloads and the first 20 characters of the admin JWT to stderr. It is a poor fit for an agent you don't supervise.
- `@sensinum/strapi-plugin-mcp` (the VirtusLab-Open-Source repo) is read-only introspection: 7 tools. Its `/api/mcp/streamable` routes are `auth: false`, and with no `allowedIPs` configured the source allows all IPs. That contradicts Strapi's own blog, which says the default is localhost only.
- Strapi's own first-party blog pattern is: introspect with a read-only tool, let the agent write `schema.json` files, restart, then seed through the REST API. That is closer to the safe path than driving the Content-Type Builder over MCP.
- Schema sync drops removed or renamed columns and tables on the next startup with no confirmation, in development and production. `strapi rename:field` (5.57.0+) generates a data-preserving migration. Migrations are up-only and run before schema sync, so they cannot seed a new content type.
- Strapi has no official front-end type solution. The docs point to a community workaround, and `strapi openapi generate` is documented as experimental. This supports your contract-first Zod and adapter design. The notum testbed takes the opposite approach (backend-generated types used directly in the UI).
- `strapi import` and `strapi transfer` wipe destination data; neither is idempotent merge. The idempotent paths in primary sources are `bootstrap()` seeding with `strapi.documents(uid)` guarded by a lookup on a unique key, or REST calls with find-before-create.
- The docs state no plan or edition limits for export, import or transfer. Treat that as UNVERIFIED.

---

## 1. Official Strapi MCP

Sources: [MCP server docs](https://docs.strapi.io/cms/features/strapi-mcp-server), [Extending the MCP server](https://docs.strapi.io/cms/plugins-development/extend-mcp-server), and the source doc `strapi/strapi:docs/docs/packages/core/core/mcp-server.md`.

**Availability.** Docs say free feature, available in development and production. They state no version. Blog says "Strapi 5.47+ ships an MCP server" and `strapi.ai` exists from 5.47 ([blog, 2026-09-26](https://strapi.io/blog/strapi-mcp-tanstack-ai-local-chat)). The blog banner says "MCP is now Generally Available". The "GA 5.49.0" figure in the brief: UNVERIFIED by me (not stated on any page I read).

**Enable.** `mcp: { enabled: true }` in `config/server.(js|ts)`, restart. Default `false`. Options: `connectTimeoutMs` (5000), `requestTimeoutMs` (60000), and `maxToolInputElements` (10000; array elements plus object keys per call; `Infinity` disables, JS/TS config only). The last one appears in the source doc, not on the docs.strapi.io page.

**Transport and auth.**
- Only `POST /mcp`. GET, DELETE, PUT and PATCH return a JSON-RPC 405. Stateless: a fresh server instance per POST. (Source doc.)
- `Authorization: Bearer <admin API token>`, validated by `strapi.service('admin::api-token-admin').authenticateAdminToken`. There is no separate MCP token type. An API (content API) token sent to `/mcp` gets 401 (blog above).
- Routes set `auth: false` at the router level, because MCP authenticates inside its handler (source doc).
- The blog also notes that clients may cache the tool list, so reconnect after schema or permission changes.

**Tool naming (docs).**
- Collection types (8): `list_<slug>`, `get_<slug>`, `create_<slug>`, `update_<slug>`, `delete_<slug>`, `publish_<slug>`, `unpublish_<slug>`, `discard_<slug>_draft`.
- Single types (up to 6): `get_<slug>`, `write_<slug>`, `delete_<slug>`, `publish_<slug>`, `unpublish_<slug>`, `discard_<slug>_draft`.
- `publish_`, `unpublish_` and `discard_` appear only when Draft & Publish is on.
- Slug rule for `api::` types: the content type name, or the API name joined to the type name with `_` when they differ. For `plugin::` types: `plugin-<plugin>_<name>`.
- Media (10): `media_list_assets`, `media_get_asset`, `media_list_folders`, `media_update_asset`, `media_move_assets`, `media_delete_assets`, `media_create_folder`, `media_rename_folder`, `media_move_folder`, `media_delete_folder`. No upload tool; media fields accept existing asset ids only.
- Utility: `log`, development mode only (`autoReload`).

**Scopes and permissions.** There are no OAuth-style scopes. Authorization is the admin permission model:
- Content: `read`, `create`, `update`, `delete`, `publish`.
- Media: `plugin::upload.read`, `plugin::upload.assets.create`, `plugin::upload.assets.update`.
- Locale-level, field-level and condition-based permissions per action.
- Four enforcement levels: tool visibility, field filtering, locale filtering, and runtime checks per document.
- A missing permission is silent: the tool just does not appear in `tools/list` (blog).
- Renaming or adding fields requires re-ticking them on the role or token, because Content Manager permissions store explicit field lists (blog).

**Limits.**
- `list_` pagination: `page` 1-indexed, `pageSize` default 25, max 100.
- Sort and filter apply to scalar fields only.
- Media `ids` arrays: 1 to 100 items.
- No rate limit, upload size limit or token expiry behaviour is documented (docs state this gap explicitly).

**Known limitations (docs).**
- Dynamic zone fields are untyped arrays.
- `list_` and `get_` do not support nested population.
- Custom fields fall back to `unknown` if the registry is not populated at registration.
- Self-referencing components become open records.
- Schemas are JSON Schema 2020-12 (MCP TS SDK v2); strict clients dropped tools on the older dialect (strapi/strapi#27395).
- Open upstream bugs worth knowing (titles only, not read in depth): `update_<type>` replaces dynamic zones and component lists whole, so a write based on a stale read removes newer rows and reports success (#28635); relation write with `set: null` returns success and clears nothing (#27432); create and update replies report to-many relations as empty arrays (#27433). Found via `gh api search/issues`.

**Audit logging.** Entry actions through MCP are recorded in Audit Logs with `origin: mcp`. Read-only operations are not recorded. Media tool audit behaviour is not described. Auth failures go to telemetry (`didNotAuthenticateMcpRequest`), but the client sees a generic `AUTHENTICATION_REQUIRED`.

**Security recommendations (docs).** One admin token per AI client or use case, least privilege. Media deletes are permanent; `media_delete_assets` and `media_delete_folder` take `dryRun`, default `true`. Deletion tools cannot tell whether an asset is referenced.

**Schema or content-type tools; roadmap.** None documented. Neither the docs page, the source doc nor the blog posts I read contain any roadmap statement. A web search found no official announcement either. Absence in what I read is not proof of absence elsewhere.

**Extending the server** (`strapi.ai.mcp`):
- `strapi.ai.mcp.registerTool(def)`, plus `registerResource` and `registerPrompt`. Optional TS helpers `ai.mcp.defineTool`, `defineResource` and `definePrompt` exported from `@strapi/strapi`; they register nothing.
- Tool fields: `name` (unique), `title`, `description`, `auth: { policies: [{ action, subject? }] }` (OR logic) or `devModeOnly: true` (mutually exclusive), `resolveInputSchema` (optional, Zod), `resolveOutputSchema` (required), `createHandler(strapi, context)` where context has `userAbility` and `user`.
- Schema resolvers run per request, so they can narrow by permissions.
- Lifecycle: register in a plugin's `register()` (preferred) or plugin `bootstrap()`. Registering in the application's `bootstrap()` throws `[MCP] Cannot register tools after the MCP server has started.` The server starts after all plugin bootstraps and before the app bootstrap.
- `devModeOnly` is evaluated against `config.isDevMode()` (`autoReload`) and "never exposed in production" (source doc).
- The docs say nothing about schema operations through this API.
- MY-INFERENCE: a custom `devModeOnly` tool is the first-party-sanctioned place to put any schema-authoring tool, because it is invisible in production by construction.

---

## 2. Third-party servers (read from source)

Data via `gh api repos/<r>`, `git/trees`, file contents, and the npm registry.

| | l33tdawg/strapi-mcp | VirtusLab-Open-Source/strapi-plugin-mcp | misterboe/strapi-mcp-server | adityarapid/strapi_mcp |
|---|---|---|---|---|
| Licence | MIT (LICENSE and package.json) | MIT | MIT | MIT |
| Last commit | 2025-07-25 (v0.2.3) | 2026-11-07 | 2026-09-11 (v2.9.0) | 2025-09-01 |
| Open issues + PRs | 0 | 0 | 0 | 0 |
| npm | `strapi-mcp` 0.2.3, maintainer l33tdawg, no provenance | `@sensinum/strapi-plugin-mcp` 1.1.4, maintainers cyp3r and kronos66, provenance attested | `@bschauer/strapi-mcp-server` 2.9.0, no provenance | package.json name `strapi-mcp-server` 2.7.1 |
| Runtime deps | 4 (sdk, axios, dotenv, form-data) | 7 (zod, lodash, ioredis, lru-cache, react-intl, @types/lodash, sdk) | 8 (incl. sharp, node-fetch, qs, zod, sdk) | 9 |
| Strapi | unstated; payload code comments say "Strapi v4" | v5 only (`@strapi/strapi ^5.14.0` peer) | v4 and v5 | v4 and v5 |

Caveats:
- The npm name `strapi-mcp-server` (no scope) currently resolves to a different package (maintainer tmty, v0.2.3, a Strapi plugin with `jose` and `ioredis`), not adityarapid's 2.7.1. Installing by that name would not get adityarapid's code. `adityarapid/strapi_mcp` has no npm package I could match. This looks like a fork of misterboe's code (same CLAUDE.md, DEBUGGING.md, `strapi.project.md` files). That is MY-INFERENCE from matching file names and sizes.
- Open issue count came from the GitHub `open_issues_count` field (which includes PRs).

### l33tdawg/strapi-mcp (`src/index.ts`, 3020 lines)

- **Tools (20, counted from the `name:` entries at lines 2091 to 2438):** `list_content_types`, `get_entries`, `get_entry`, `create_entry`, `update_entry`, `delete_entry`, `upload_media`, `upload_media_from_path`, `get_content_type_schema`, `connect_relation`, `disconnect_relation`, `create_content_type`, `update_content_type`, `delete_content_type`, `list_components`, `get_component_schema`, `create_component`, `update_component`, `publish_entry`, `unpublish_entry`.
- **What the schema tools call.** All go through `makeAdminApiRequest` (line 207), an axios call with `Authorization: Bearer <admin JWT>`:
  - `create_content_type`: `POST /content-type-builder/content-types`, body `{ contentType: { displayName, singularName, pluralName, kind, collectionName, options: { draftAndPublish }, pluginOptions: {}, attributes } }` (lines 1543 to 1568).
  - `update_content_type`: `PUT /content-type-builder/content-types/<uid>` (lines 1481 to 1490).
  - `delete_content_type`: `DELETE /content-type-builder/content-types/<uid>` (line 2898).
  - `create_component`: `POST /content-type-builder/components`; `update_component`: `PUT .../components/<uid>` (lines 1860, 1921).
  - Reads use `GET /content-type-builder/content-types` and `/components`.
  - Not direct file writes: there is no `fs` write anywhere in the file. Strapi itself writes files (see section 3).
- **Auth.** Admin routes need an admin JWT. The server gets it by `POST {STRAPI_URL}/admin/login` with `STRAPI_ADMIN_EMAIL` and `STRAPI_ADMIN_PASSWORD` (lines 164 to 202). Without those, `makeAdminApiRequest` throws "Not authenticated for admin API access". `STRAPI_API_TOKEN` alone covers only the content-API tools. It needs a full admin account's password in the MCP process environment. That is MY-INFERENCE from the code path, not a documented requirement. Whether a Strapi admin API token would also be accepted on these admin routes: UNVERIFIED (an `admin-token` auth strategy exists in `strapi/strapi` `packages/core/admin/server/src/strategies/admin-token.ts`; I did not confirm it is attached to the Content-Type Builder routes).
- **Dev mode.** `STRAPI_DEV_MODE` is read at line 97 and printed at line 117, and used nowhere else. The README header says "Support for Strapi in development mode" (line 19). The server does not enforce dev mode. Strapi does (section 3).
- **On restart or autoReload.** The tool comments say "Strapi might be restarting" and return the response unchanged. In `strapi develop`, schema writes trigger a reload and the connection may drop mid-call. Nothing in the server waits for health or re-polls. UNVERIFIED at runtime (not run).
- **Payload shape vs v5.** The code comments call the endpoint "documented for Strapi v4". Whether this payload validates against the v5 Content-Type Builder validators was not tested. UNVERIFIED.
- **Logging and security.** About 236 `console.error` calls to stderr, including full request payloads for admin calls (line 223), response headers, the first 20 characters of the admin JWT (lines 183, 227), and the admin email at login. Password itself is not printed. No confirmation or dry-run on `delete_content_type`; its schema is a single required `contentType` uid. Dependencies are pinned loosely (`axios ^1.6.7`; SDK 1.10.2 is old).

### VirtusLab-Open-Source/strapi-plugin-mcp (npm `@sensinum/strapi-plugin-mcp`)

- A Strapi plugin, not a standalone server. Endpoints `GET`, `POST` and `DELETE /api/mcp/streamable` (README; `server/src/routes/content-api.ts`).
- **Tools (7, all read-only):** `get-content-types`, `get-content-type-by-name`, `get-components`, `get-component-by-name`, `get-services`, `get-service-methods`, `get-strapi-info`. Plus a custom-tool registry (`custom.service.ts`). No schema writes, no content writes.
- **Auth.** All three routes are `config: { auth: false }` with only a `plugin::mcp.ip-allowlist` policy. In `ip-allowlist.ts`, when `allowedIPs` is empty or unset it logs "No allowed IPs configured, allowing all IPs" and returns true. `getPluginConfig` falls back to memory sessions with no `allowedIPs`. So a default install is unauthenticated and open to any IP. Strapi's own blog states "The default `allowedIPs` is localhost only" ([blog, 2026-04-30](https://strapi.io/blog/claude-code-strapi-mcp-ai-content-workflows)); the source I read contradicts that. Maybe the README documents an example config, which I did not verify as default.
- The README warns: "should NEVER be enabled in production". Sessions: memory (LRU) or Redis.
- Exposes internal structure (service names and methods, instance info), so treat the endpoint as sensitive even though it only reads.

### misterboe/strapi-mcp-server (`@bschauer/strapi-mcp-server`)

- **Tools (5):** `strapi_list_servers`, `strapi_get_content_types`, `strapi_get_components`, `strapi_rest`, `strapi_upload_media`. Config file `~/.mcp/strapi-mcp-server.config.json` holds `api_url` and `api_key`.
- Schema reads hit `/api/content-type-builder/content-types` and `/components` (GET only). No schema writes.
- `strapi_rest` allows GET, POST, PUT, DELETE. Writes require the caller to pass `userAuthorized: true` (a prompt-level honour flag, enforced by a Zod refine; the model can set it itself). MY-INFERENCE: it is not a human-in-the-loop control.
- 2.9.0 fixed an SSRF in `strapi_upload_media` (CHANGELOG). README disclaimer: AI-assisted code, "should NOT be used in production".

### adityarapid/strapi_mcp

Same tool set as misterboe (`strapi_list_servers`, `strapi_get_content_types`, `strapi_get_components`, `strapi_rest`, `strapi_upload_media`) plus an HTTP server (`src/http-server.ts`, `http-wrapper.js`, Dockerfile, smithery.yaml). Same disclaimer. Last commit 2025-09-01. No schema writes.

### Summary for schema authoring

Only l33tdawg offers schema create/update/delete tools, and it is the least maintained and least careful of the four. No other server I read writes schema.

---

## 3. Strapi 5 schema creation

**Content-Type Builder (docs):** [Content-type Builder](https://docs.strapi.io/cms/features/content-type-builder) is "Available in Development environment only". Permission needed is only `plugin::content-type-builder.read`.

**Admin routes (source, `packages/core/content-type-builder/server/src/routes/admin.ts`):**
- Reads: `GET /reserved-names`, `/content-types`, `/content-types/:uid`, `/components`, `/components/:uid`, `/schema`, `/update-schema-status`.
- Writes: `POST` and `PUT /content-types[/:uid]`, `DELETE /content-types/:uid`, `POST`, `PUT` and `DELETE /components[/:uid]`, `PUT` and `DELETE /component-categories/:name`, and the bulk `POST /update-schema`.
- Every write route has `middlewares: [isDevelopmentMode]`. Its source says: "prevents SQL injection vulnerabilities in production by blocking schema modifications when autoReload is disabled." If `autoReload !== true` it throws a `PolicyError`: "Content-Type Builder modifications are disabled in production mode ... (strapi develop)".
- Notable: the write routes are guarded by the `.read` permission, so any admin who can open the builder can write schema in dev mode. MY-INFERENCE: dev mode is the only real gate.

**File writes (source, `services/schema-builder/schema-handler.ts`):** Strapi writes JSON itself with `fs-extra` (`ensureFile`, `writeJSON(..., { spaces: 2 })`, `remove`) and restores the previous state on failure (lines about 282 to 346). Paths per models docs: `src/api/<api>/content-types/<name>/schema.json` and `src/components/<category>/<name>.json`. `groups.json` (folders) is documented separately and is not carried by data transfer.

**Restart (source, `controllers/schema.ts` `updateSchema`):** turns the file watcher off, writes, then `setImmediate(() => strapi.reload())`. An in-process lock returns 409 "Schema update is already in progress." Status is available at `GET /update-schema-status`. On error the watcher is resumed and the server returns 400. The admin UI needs a server restart for the schema to take effect.

**Hand-written files (docs):** [Models](https://docs.strapi.io/cms/backend-customization/models) documents `schema.json` fully (`kind`, `collectionName`, `info.singularName/pluralName/displayName`, `options.draftAndPublish`, `pluginOptions`, `attributes`). Docs say `schema.json` "is generated automatically", but any JSON in those folders loads as a model. Controllers, routes and services are separate one-line factories (`factories.createCoreController` etc.; shown in the notum add-content-type skill, not on the Models page).

**Data loss on schema change.**
- [Database migrations](https://docs.strapi.io/cms/database-migrations): on startup Strapi drops tables, columns, indexes and foreign keys it previously managed that no longer match the schemas, "without any warning or confirmation prompt", in development and production. Deleting a content type deletes its table and data on next startup. `forceMigration: false` skips drops. Tables Strapi never managed are left alone. Page is marked experimental.
- Content-type Builder docs say, for a deleted content type, that entries disappear from the Content Manager but the database data is kept. That conflicts with the migrations page. Treat as UNVERIFIED which is right; MY-INFERENCE: assume data is lost.
- Rename in the builder renames the column (data kept). If type, relation or component also changes in the same save, the field is recreated empty. Renaming a content-type or component API id creates a new table; old data is no longer reachable from the admin.
- Hand-editing a field key in `schema.json` is a drop plus create (MY-INFERENCE from the sync rule above; the local notum skill states the same).
- `strapi rename:field <uid> <old> <new>` (5.57.0): updates the schema file and writes a migration into `./database/migrations` that renames the column, runs at next startup. It refuses renames it cannot migrate (for example polymorphic relations).

**Migrations (docs):** files in `./database/migrations`, export `up()`, run once in alphabetical order inside a transaction, no down migrations, no CLI to run them. Order at startup: load schema, run pending migrations (yours first), sync the DB schema, store the new schema as the reference. So a migration "sees the database in its old state", and on a fresh DB the content-type tables do not exist yet (the strapi.io seeding post says the same).

**Authoring pitfalls for automated generation (docs unless noted):**
- Relations: `inversedBy` on the owner and `mappedBy` on the inverse. A `mappedBy` without a matching `inversedBy` on the target fails boot.
- `uid`: `targetField` plus a value matching `/^[A-Za-z0-9-_.~]*$/`.
- Dynamic zones: `components` array of `category.name`; components in the same zone cannot share a field name with different types.
- Draft & Publish: `unique` is skipped for drafts, so duplicates surface only at publish. `draftAndPublish` defaults to `true`, but `false` when created via the interactive CLI.
- i18n: localisation is per attribute via `pluginOptions.i18n.localized`; the locale list used by MCP is read once at startup.
- IDs: `documentId` (string) is the stable v5 identifier; `id` is a per-version row id. Do not update repeatable components by reusing published component `id`s.
- Enumeration values should start with a letter (GraphQL plugin caveat).
- A newly added component is not writable until Strapi has restarted and registered it (notum seed-content skill; matches the MCP "locales read once" note, not a Strapi docs statement).

---

## 4. Seeding and data transfer

| Approach | Documented in primary source? | Notes |
|---|---|---|
| `strapi export` | Yes ([export](https://docs.strapi.io/cms/features/data-management/export)) | `--file/-f`, `--key/-k`, `--no-encrypt`, `--no-compress`, `--only`, `--exclude` (`content`, `files`, `config`), `--format dir` (requires `--no-encrypt`), `--only-content-types` and `--exclude-content-types`. Default encryption `aes-128-ecb`. Schemas always included. Admin users and API tokens not exported. |
| `strapi import` | Yes ([import](https://docs.strapi.io/cms/features/data-management/import)) | Same filters plus `--force`. "deletes all existing data, including the database and uploads directory, before importing". Source and target schemas must match. Cloud storage warning: removed media records may be permanently deleted at the provider. `createdBy` and `updatedBy` end up empty. |
| `strapi transfer` | Yes ([transfer](https://docs.strapi.io/cms/features/data-management/transfer)) | `--to/--from` (the remote `/admin` URL), `--to-token/--from-token`, `--force`, `--only`, `--exclude` (adds `media-library`), content-type filters, `--throttle`, `--no-checksums`, `--verbose`. Both instances need matching schemas. Remote must run `start`, not `develop`. Deletes destination data in scope. Config `transfer.remote.enabled` and `transfer.remote.assetIdleTimeoutMs`. Fails with websockets or Socket.io projects. Admin users and API tokens not transferred. |
| `bootstrap()` seeding | Yes ([lifecycle functions](https://docs.strapi.io/cms/configurations/functions)) | Runs at every start, after the app is set up; the docs example checks for existing data first. |
| Document Service | Yes ([Document Service](https://docs.strapi.io/cms/api/document-service)) | `create`, `update`, `delete`, `publish`, `unpublish`, `discardDraft`, `findFirst`. No bulk create, upsert or idempotency helper is documented. `create` makes a draft unless `status: 'published'`. |
| REST | Yes ([REST](https://docs.strapi.io/cms/api/rest)) | `POST /api/:plural` with `{ data }`. With Draft & Publish, POST and PUT publish by default; `?status=draft` keeps a draft. No bulk operations documented. |
| Strapi Client | Yes ([client](https://docs.strapi.io/cms/api/client)) | `@strapi/client`: `collection().create/update/delete`, `files.upload`. |

**Plan or edition limits:** the export, import and transfer pages do not mention plans. UNVERIFIED. The Content-type Builder page says its AI assistant requires "Strapi AI Growth".

**Idempotency patterns (first-party, [strapi.io seeding post, 2026-09-09](https://strapi.io/blog/seed-data-in-strapi)):**
- Count check: skip if the collection is non-empty; simple, but new seed rows are never added.
- Upsert by unique key such as `slug`: find first, create only the missing ones.
- Plugin-store marker for one-time seeds.
- Seed in `bootstrap()` (after schema sync), not in migrations (migrations run before the tables exist). Seed demo content only in development. Pass `status: 'published'`. For editor content between environments use `strapi transfer`.
- Production one-off fixes: `strapi console` or a standalone script, not a migration.
- Media must exist before entries reference it (official MCP cannot upload). Upload via `POST /api/upload` first (docs: Upload plugin has its own endpoints).

---

## 5. Type-safe contract between Strapi 5 and Next.js

**Strapi's own types.**
- `strapi ts:generate-types` (`--debug`, `--silent`, `--out-dir`) writes a `types` folder at the project root. TypeScript projects regenerate on `strapi develop`; JS projects too unless `autogenerate: false`. ([CLI](https://docs.strapi.io/cms/cli), [TypeScript development](https://docs.strapi.io/cms/typescript/development))
- Use `UID` and `Data` from `@strapi/strapi` (`Data.ContentType<'api::article.article'>`, `Data.Component<...>`). "Types should only be imported from `@strapi/strapi` ... `@strapi/types` are for internal use only." ([documents and entries](https://docs.strapi.io/cms/typescript/documents-and-entries))
- For front ends the docs say: "use a workaround until Strapi implements an official solution" (links to a community repo). So no official front-end type package exists in the docs I read.
- `strapi openapi generate [-o file]` emits OpenAPI 3.1; marked experimental, and nested component `required` metadata can be missing ([openapi](https://docs.strapi.io/cms/api/openapi)). So a generated client may type fields looser than Strapi enforces.
- `@strapi/client` has no documented TypeScript generics.

**v5 REST response shape (docs).** Flat attributes (no `data.attributes`); each document has integer `id`, string `documentId`; list responses carry `meta.pagination { page, pageSize, pageCount, total }`; missing document gives `data: null` plus `error`. Addressing is by `documentId`. Delete returns 204 with no body. Nothing is populated by default (relations, media, components, dynamic zones need `populate`). Dynamic zone entries carry `__component`. Components have no endpoints of their own. (Source: [REST](https://docs.strapi.io/cms/api/rest).)

**Populate and fields.** `fields` selects root scalar fields only; relation selection needs `populate` (blog search summary; docs REST page lists both parameters). Your adapter notes `populate=*` reaches one level only and names relations explicitly (`source.strapi.ts`); I did not re-verify the one-level claim in a Strapi page, so UNVERIFIED as a docs quote.

**Next.js consumption.** Strapi's blog has many "Strapi 5 + Next.js" tutorials that use a shared base interface with `id` and `documentId`, and generic list and single wrappers. They are tutorials, not recommendations about architecture. I found no first-party statement on front-end decoupling, adapters or DTO layers. UNVERIFIED that none exists elsewhere.

**Local reference: notum-starter-testbed** (`C:\Users\herma\source\repository\strapi-projects\notum-starter-testbed`).
- `packages/strapi-types` is a types-only workspace package (`@repo/strapi-types`, devDeps `@strapi/strapi 5.48.1` and smart-populate). It re-exports `Data`, `Modules`, `Schema`, `UID` and the generated `components.d.ts` and `contentTypes.d.ts`, and defines wrapper types `FindMany`, `FindFirst`, `FindOne` and `Result<UID, Params>` over the Document Service param types with smart-populate. It deliberately avoids `@strapi/types`.
- `apps/ui` Strapi client (`apps/docs/docs/ui/strapi-api-client.md`): `PublicStrapiClient` (server-side API token) and `PrivateStrapiClient` (end-user JWT); methods `fetchOne`, `fetchMany`, `fetchAll`, `fetchOneBySlug`, `fetchOneByFullPath`. Typed by content-type UID. An `API_ENDPOINTS` map keyed by UID must be kept in sync by hand. Proxy routes with an endpoint allowlist for browser fetches. Server Components pass `status: draftMode ? 'draft' : 'published'`.
- So notum lets Strapi's generated types define the UI's types directly. That is the dependency direction your CLAUDE.md contract rule prohibits.
- `.claude/skills/add-content-type`: seven phases: pick kind, i18n, draft/publish; scaffold `schema.json` plus controller, service and router factories by hand; attributes; run `generate:types`; wire `API_ENDPOINTS` and proxy allowlist; classify the type in an admin-role policy (the `pnpm verify` gate fails until it is classified); verify by booting Strapi, creating one entry and calling the REST endpoint.
- `.claude/skills/strapi-schema-check`: `scripts/check.sh [base]` diffs `schema.json` and component JSON against the base branch with `jq`. It flags field rename, delete, type change, `required: true` added, `unique: true` added and whole-file deletion as critical; exit 0 clean, 1 risky without migration (block), 2 risky with matching migration (review), 3 internal failure. It also states (from reading `@strapi/database` in `node_modules`) that `required` is not a NOT NULL column, `unique` creates a real index and can fail boot, and user migrations run before `syncSchema()`, so they need a `hasTable` guard. Those code-level claims I did not re-verify in `strapi/strapi`.
- `.claude/skills/seed-content` (user-invoked only): seeds pages through the official Strapi MCP. Rules: read the live schema first; a component must be registered (Strapi restarted, `GET /api/health` 200) before its UID is written; dynamic-zone writes replace the whole field, so GET, append, PUT; find-before-create by natural key (`fullPath` plus `locale`); media by id only, uploaded via `POST /api/upload` first; preview before write; report created, updated, reused, skipped. Baseline content uses `strapi export` and `strapi import` plus `scripts/seed-*.mjs` (see `apps/docs/docs/strapi/data-seeding.md`: imports overwrite data; dev and test only).
- `apps/docs/docs/strapi/strapi-schemas.md`: component naming `category.kebab-name`, `collectionName` `components_<category>_<name>`; per-attribute i18n flag; document middlewares preferred over lifecycles because publishing creates a new DB row and fires `afterCreate`.

**Local reference: adu-dev.**
- `src/features/work/lib/contract.ts`: Zod schemas `Slug`, `MediaRef`, `Discipline`, `CaseStudy`, `CaseStudySummary`, `ListQuery`, and the `CaseStudySource` interface (`list`, `bySlug`, `slugs`). Comment: no CMS import, no generated type may replace these schemas. `src/features/dashboard/lib/contract.ts` follows the same pattern, with nullable figures and no `source.strapi.ts` yet.
- `source.strapi.ts`: config check with a clear error; `WireEntry` loose-object Zod schemas with every field `nullish` ("did transport deliver the right primitive type"); explicit `populate[...]` params; 10 s timeout, 60 s revalidate, cache tag `case-studies`, page size 100; maps the wire entry to the contract and then `CaseStudy.parse()`. Draft handling: `status=published` on every request.
- `lib/index.ts`: the only file that picks `local` versus `strapi` from `env.CONTENT_SOURCE`.
- `cms/README.md`: Strapi-side model (`case-study` collection plus five `work.*` components) copied verbatim into a Strapi project **before first start**. It keeps a field map: `slug` as `uid` with the contract's regex; `disciplines` as a repeatable one-field component with identical enum strings; `cover` dropped to `null` with a warning when alt text or dimensions are missing. It records verification against Strapi 5.60 on Postgres 16 with byte-identical results to the local source across nine queries.
- Related: `docs/STATE.md` and `CLAUDE.md` (contract rule, `CONTENT_SOURCE=local` must always work).

**Decoupling, from primary sources only.** Strapi's docs give no guidance on front-end decoupling beyond "no official front-end types". MY-INFERENCE: your wire-schema then contract-schema split is consistent with the documented facts that (a) generated types are not published for front ends, (b) OpenAPI output is experimental and can under-specify `required`, (c) `populate` and `fields` behave in ways that make the wire shape query-dependent. The cost: every new field needs a hand-edit in `contract.ts`, `schema.json`, `cms/README.md` and the adapter.

---

## 6. Pitfalls and recommendations for agent-driven schema changes

**Must be gated.**
1. Schema diff review before restart. SOURCED: schema sync drops removed or renamed columns and tables with no prompt ([database migrations](https://docs.strapi.io/cms/database-migrations)). The notum `check.sh` is a worked example of a gate. Adopting it is MY-INFERENCE.
2. Type regeneration after any schema edit. SOURCED: `ts:generate-types` ([CLI](https://docs.strapi.io/cms/cli)); notum enforces it with a `types:check` that regenerates and fails on diff (local file).
3. Restart before writing to a new component or content type. SOURCED (blog: "Reconnect the client afterwards", and locale list read once at startup); component-registration rule is from the notum skill only.
4. A data backup (`strapi export`) before any rename, delete or type change. MY-INFERENCE, supported by the docs' statement that there are no down migrations. The first-party content-types blog also recommends backing up `src/api/` and existing `schema.json` before overwriting ([blog](https://strapi.io/blog/auto-generate-strapi-content-types-claude)).
5. Renames through `strapi rename:field`, never by editing the key. SOURCED (CLI docs, 5.57.0+).
6. Contract parity: update `contract.ts`, then `schema.json`, then the adapter, then `cms/README.md`. MY-INFERENCE from your CLAUDE.md contract rule.

**Must never run in production.**
- Content-Type Builder writes (blocked by `isDevelopmentMode`; SOURCED).
- Any third-party schema-authoring or introspection server. `@sensinum` says "NEVER" (README); misterboe and adityarapid say not for production; l33tdawg states nothing and holds an admin password (SOURCED from each repo).
- `strapi import`, or `strapi transfer` into a live target, without a verified backup (they delete destination data; SOURCED).
- Seed demo content in production (SOURCED, strapi.io seeding post).
- Admin-token MCP with write permissions on production: MY-INFERENCE; docs only say least privilege, per-client tokens.

**Choosing the path.**
- MY-INFERENCE: for schema changes use hand-written or agent-written `schema.json` plus restart (the pattern in Strapi's own two April 2026 blog posts), not the Content-Type Builder over MCP. Reasons: diffable in git, reviewable, works with the schema-check gate, and avoids holding an admin password in an MCP process.
- Use the official `/mcp` with a least-privilege admin token for content seeding and edits. SOURCED for its permissions model. The known upstream bugs above (dynamic zone replace, relation `set: null`) argue for read-back verification after each write (MY-INFERENCE).

---

## Unverified / open questions

- GA version "5.49.0": not stated on any page I read. Blog says 5.47+.
- Whether admin API tokens (not JWTs) authenticate the Content-Type Builder admin routes. The `admin-token` strategy exists; its attachment to those routes was not checked.
- l33tdawg runtime behaviour on Strapi 5.x: payload validity and handling of the restart mid-response (not run, by instruction).
- Sensinum default exposure: source says allow-all when `allowedIPs` is unset; Strapi's blog says localhost default. I did not check whether the README or a runtime default sets `allowedIPs`.
- Conflict: Content-type Builder docs say deleting a content type keeps database data; migrations docs say the table is dropped on next startup.
- Plan or edition limits for export, import, transfer: not stated.
- Roadmap for schema tools in the official MCP: no statement found; absence is not proof.
- Whether `populate=*` reaching one level is a documented statement (it is stated in your adapter comment; not re-confirmed against Strapi docs).
- Behaviour of `strapi ts:generate-types` when run by an agent against a not-yet-restarted schema: not documented.
- npm `strapi-mcp-server` name collision (section 2): which package adityarapid's code is published under, if any.
- Notum's claims about `@strapi/database` internals (required not NOT NULL, unique indexes): taken from its skill, not from `strapi/strapi` source.

---

## Recommended safe agent sequence

For adding a content type and seeding it. Development environment only; nothing here targets production.

The order matters. Everything that needs a running Strapi happens before it is stopped; nothing changes schema files while it runs.

1. **Preflight (MY-INFERENCE).** Confirm `NODE_ENV` is not production and the target is the dev database.
2. **Contract first (SOURCED from `CLAUDE.md`).** Add or change the Zod schema in `src/features/<name>/lib/contract.ts`. Keep nullable figures nullable; no invented metrics.
3. **Introspect while Strapi still runs (SOURCED pattern).** Read the existing schema from the files in `cms/` and `src/api/`. Any live reads through the official MCP read tools happen here, before step 5, and are saved for the steps that follow. Do not use a write-capable third-party server.
4. **Backup (MY-INFERENCE, supported by no-down-migrations docs).** `strapi export --no-encrypt --format dir` (or an encrypted `.tar.gz.enc`) of the dev database if it holds anything you want to keep.
5. **Stop Strapi and its file watcher (SOURCED mechanism, MY-INFERENCE rule)**, and keep them stopped until step 7 passes. `strapi develop` watches the source tree and can restart on a schema edit ([develop.ts watcher](https://github.com/strapi/strapi/blob/a8555e1bded71bd5b33734296c7a83a00bec0e57/packages/core/strapi/src/node/develop.ts#L463-L477)), which would run the destructive schema sync before the drift gate has seen the diff. No MCP calls from here until step 8.
6. **Write schema files, not API calls (MY-INFERENCE, matching Strapi's blog pattern).** Create `schema.json`, controller, service and router factories, and component JSON, following `cms/README.md` conventions. For a rename, run `strapi rename:field` (SOURCED). Copy into the Strapi project before first start where the type is new (your own README).
7. **Schema drift gate (MY-INFERENCE, modelled on notum `check.sh`).** Diff `schema.json` and component JSON against the base branch. Block on rename, delete, type change, `required` or `unique` added, or file deletion unless a matching migration exists (migration location SOURCED).
8. **Start Strapi, only now (SOURCED).** Start `strapi develop` so it syncs the schema and registers components. Poll a health endpoint until it answers (notum uses `GET /api/health`). Reconnect the MCP client, since some cache the tool list (SOURCED).
9. **Regenerate Strapi types (SOURCED)** if the Strapi project is TypeScript and any tooling uses them: `strapi ts:generate-types`. Not required by the adapter, which does not import them (MY-INFERENCE).
10. **Permissions (SOURCED).** Re-tick new fields on the role or admin token that the agent uses (field lists are explicit). Keep the site's content API token read-only.
11. **Seed (SOURCED patterns).** Prefer `bootstrap()` or the official MCP with find-before-create on a unique key (`slug`), `status: 'published'` for published content, media uploaded first and referenced by id. Dynamic zones: GET, append, PUT the whole array (notum rule; consistent with upstream #28635). Avoid `strapi import` for incremental seeds, because it deletes existing data.
12. **Verify at the boundary (SOURCED from your README).** Fetch through the adapter with `CONTENT_SOURCE=strapi`; `Schema.parse()` must pass. Compare to the `local` source. Confirm drafts stay invisible.
13. **Commit as one reviewable change (MY-INFERENCE).** Contract, `cms/` model, adapter mapping and README field map move together. If `CONTENT_SOURCE=local` stops working, the change is wrong (SOURCED from `CLAUDE.md`).

Stop and ask a human when: the drift gate finds a risky change, a restart does not come back healthy, a seed would run against anything but the dev database, or a step needs an admin password or a token with delete or publish rights on a non-dev instance (MY-INFERENCE).
