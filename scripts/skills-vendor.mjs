// Vendored agent skills: pull a pinned release, and check nothing drifted.
//
//   node scripts/skills-vendor.mjs check
//       Recompute every vendored skill's hash and compare it with
//       .claude/skills/vendor.lock.json. Exits 1 on any drift. CI runs this.
//
//   node scripts/skills-vendor.mjs pull <tag>
//       Download mattpocock/skills at <tag> (via `gh`), replace the vendored
//       skills with that release's engineering + productivity skills, keep the
//       upstream licence, and rewrite the lock. Review the diff, then commit.
//
// Why: the skills are part of the harness. A pinned copy means this machine,
// a cloud runner and a client checkout all run the same instructions, and an
// upgrade arrives as a reviewed diff instead of a silent auto-update.
//
// Hashes cover file paths and contents with line endings normalised to LF,
// so a Windows checkout and CI agree. No dependencies; needs `gh` and `tar`
// only for `pull`.

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const SKILLS = join(ROOT, ".claude", "skills");
const LOCK = join(SKILLS, "vendor.lock.json");
const SOURCE = "mattpocock/skills";
const GROUPS = ["engineering", "productivity"];
const LICENSE_FILE = "LICENSE.mattpocock-skills";

function filesUnder(dir) {
  const out = [];
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...filesUnder(full));
    else out.push(full);
  }
  return out;
}

function hashOf(path) {
  const hash = createHash("sha256");
  const files = statSync(path).isDirectory() ? filesUnder(path) : [path];
  for (const file of files) {
    const rel = relative(path, file).split(sep).join("/");
    const text = readFileSync(file).toString("utf8").replace(/\r\n/g, "\n");
    hash.update(`${rel}\0${text}\0`);
  }
  return hash.digest("hex");
}

function check() {
  if (!existsSync(LOCK)) {
    console.error(`No ${relative(ROOT, LOCK)}. Run: node scripts/skills-vendor.mjs pull <tag>`);
    process.exit(1);
  }
  const lock = JSON.parse(readFileSync(LOCK, "utf8"));
  const drift = [];
  for (const [name, entry] of Object.entries(lock.skills)) {
    const dir = join(SKILLS, name);
    if (!existsSync(dir)) drift.push(`${name}: missing`);
    else if (hashOf(dir) !== entry.sha256) drift.push(`${name}: changed`);
  }
  const license = join(SKILLS, LICENSE_FILE);
  if (!existsSync(license) || hashOf(license) !== lock.license.sha256) {
    drift.push(`${LICENSE_FILE}: missing or changed`);
  }
  if (drift.length > 0) {
    console.error(
      `Vendored skills differ from ${lock.source}@${lock.ref} (${lock.commit.slice(0, 7)}):\n` +
        drift.map((d) => `  - ${d}`).join("\n") +
        `\n\nVendored skills are not edited in place. To upgrade, run\n` +
        `  node scripts/skills-vendor.mjs pull <tag>\n` +
        `and review the diff. A deliberate local patch needs its own lock entry and a note in .claude/skills/README.md.`,
    );
    process.exit(1);
  }
  console.log(
    `Vendored skills: ${Object.keys(lock.skills).length} match ${lock.source}@${lock.ref} (${lock.commit.slice(0, 7)}).`,
  );
}

function gh(args) {
  return execFileSync("gh", args, { encoding: "utf8" }).trim();
}

function pull(ref) {
  if (!ref) {
    console.error("Usage: node scripts/skills-vendor.mjs pull <tag>");
    process.exit(1);
  }
  const commit = gh(["api", `repos/${SOURCE}/commits/${ref}`, "--jq", ".sha"]);

  // Downloaded content is data: extract into its own empty directory, copy
  // files across, never execute anything from it.
  const work = mkdtempSync(join(tmpdir(), "skills-vendor-"));
  try {
    const tarball = join(work, "release.tar.gz");
    const tar = execFileSync("gh", ["api", `repos/${SOURCE}/tarball/${commit}`]);
    writeFileSync(tarball, tar);
    // Relative names, run from inside the work dir: GNU tar (Git Bash) reads
    // an absolute Windows path like C:\... as a remote host:path. Extract only
    // what is vendored: the repo root carries a symlink Windows can't create.
    const top = `${SOURCE.replace("/", "-")}-${commit.slice(0, 7)}`;
    const members = [...GROUPS.map((g) => `${top}/skills/${g}`), `${top}/LICENSE`];
    execFileSync("tar", ["-xzf", "release.tar.gz", ...members], { cwd: work });
    const src = join(work, top);

    const previous = existsSync(LOCK) ? JSON.parse(readFileSync(LOCK, "utf8")) : { skills: {} };

    const incoming = [];
    for (const group of GROUPS) {
      const groupDir = join(src, "skills", group);
      for (const name of readdirSync(groupDir).sort()) {
        if (statSync(join(groupDir, name)).isDirectory()) incoming.push({ group, name });
      }
    }

    // Refuse before touching anything: a collision found mid-copy would leave
    // the installed release half-deleted and the lock pointing at it.
    const collisions = incoming
      .map(({ name }) => name)
      .filter((name) => existsSync(join(SKILLS, name)) && !previous.skills[name]);
    if (collisions.length > 0) {
      throw new Error(
        `Not vendored, but already in .claude/skills: ${collisions.join(", ")}. ` +
          `Refusing to overwrite repo-authored skills; nothing was changed.`,
      );
    }

    for (const name of Object.keys(previous.skills)) {
      rmSync(join(SKILLS, name), { recursive: true, force: true });
    }

    const skills = {};
    for (const { group, name } of incoming) {
      const to = join(SKILLS, name);
      cpSync(join(src, "skills", group, name), to, { recursive: true });
      skills[name] = { path: `skills/${group}/${name}`, sha256: hashOf(to) };
    }
    cpSync(join(src, "LICENSE"), join(SKILLS, LICENSE_FILE));

    const lock = {
      source: SOURCE,
      ref,
      commit,
      license: { file: LICENSE_FILE, spdx: "MIT", sha256: hashOf(join(SKILLS, LICENSE_FILE)) },
      skills,
    };
    writeFileSync(LOCK, JSON.stringify(lock, null, 2) + "\n");
    console.log(`Vendored ${Object.keys(skills).length} skills from ${SOURCE}@${ref} (${commit.slice(0, 7)}). Review the diff before committing.`);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

const [command, arg] = process.argv.slice(2);
if (command === "check") check();
else if (command === "pull") pull(arg);
else {
  console.error("Usage: node scripts/skills-vendor.mjs check | pull <tag>");
  process.exit(1);
}
