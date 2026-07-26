/**
 * Regenerates Strapi's content-type definitions and mirrors them into
 * @repo/strapi-types, so the frontend can consume them without reaching into
 * the backend workspace.
 *
 * Strapi generates into apps/strapi/types/generated and stays there — its own
 * `ts:generate-types --help` warns that redirecting the output "might break
 * types exposed by Strapi". So this copies rather than moves.
 *
 *   sync-strapi-types.mts           generate, then update the mirror
 *   sync-strapi-types.mts --check   generate, then fail if the mirror differs
 *
 * The check regenerates rather than trusting the backend's committed copy, so
 * a schema edited without regenerating is caught too. Node rather than `cp -r`
 * because this repository is developed on Windows.
 */
import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const backendDir = path.join(repoRoot, 'apps', 'strapi');
const sourceDir = path.join(backendDir, 'types', 'generated');
const mirrorDir = path.join(repoRoot, 'packages', 'strapi-types', 'generated');

const FILES = ['components.d.ts', 'contentTypes.d.ts'];
const check = process.argv.includes('--check');

function generate(): void {
  console.log('Generating types from the Strapi schema…');
  execFileSync('pnpm', ['exec', 'strapi', 'ts:generate-types', '--silent'], {
    cwd: backendDir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
}

function read(dir: string, file: string): string | undefined {
  const full = path.join(dir, file);
  return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : undefined;
}

generate();

const drifted: string[] = [];
for (const file of FILES) {
  const source = read(sourceDir, file);
  if (source === undefined) {
    console.error(`Expected generated file is missing: ${file}`);
    process.exit(1);
  }

  if (check) {
    if (read(mirrorDir, file) !== source) drifted.push(file);
    continue;
  }

  fs.mkdirSync(mirrorDir, { recursive: true });
  fs.writeFileSync(path.join(mirrorDir, file), source, 'utf8');
  console.log(`Mirrored ${file}`);
}

if (check === true) {
  if (drifted.length > 0) {
    console.error(
      `\n@repo/strapi-types is out of date with the Strapi schema:\n` +
        drifted.map((f) => `  - ${f}`).join('\n') +
        `\n\nRun 'pnpm sync:types' and commit the result.`
    );
    process.exit(1);
  }
  console.log('@repo/strapi-types matches the Strapi schema.');
}
