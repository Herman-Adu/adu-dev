// Checks a pull request's title and branch name against the house conventions.
// Runs in CI on pull requests; no dependencies, so it needs only Node.
//
//   PR title: Conventional Commits, `type(scope)!: subject`. With squash
//             merges the title becomes the commit on main, so it is the
//             history that matters.
//   Branch:   `<type>/<issue>-<slug>`, so every branch traces to an issue.
//             Dependabot's own branches are exempt.
//
// Usage: PR_TITLE="..." HEAD_REF="..." node scripts/check-conventions.mjs

const TYPES = [
  "feat",
  "fix",
  "docs",
  "chore",
  "refactor",
  "perf",
  "test",
  "build",
  "ci",
  "style",
  "revert",
];

const types = TYPES.join("|");
const TITLE = new RegExp(`^(${types})(\\([a-z0-9-]+\\))?!?: \\S.{0,70}$`);
const BRANCH = new RegExp(`^(${types})/\\d+-[a-z0-9]+(-[a-z0-9]+)*$`);
const EXEMPT_BRANCH = /^dependabot\//;

const title = process.env.PR_TITLE ?? "";
const branch = process.env.HEAD_REF ?? "";
const failures = [];

if (!TITLE.test(title)) {
  failures.push(
    `PR title "${title}" is not a Conventional Commit.\n` +
      `  Expected: type(scope): subject, type one of ${TYPES.join(", ")}, at most 72 characters after the type.\n` +
      `  Example:  fix(hero): stop reading refs during render`,
  );
}

if (!EXEMPT_BRANCH.test(branch) && !BRANCH.test(branch)) {
  failures.push(
    `Branch "${branch}" does not match <type>/<issue>-<slug>.\n` +
      `  Example: fix/16-forge-scene-lint`,
  );
}

if (failures.length > 0) {
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`conventions ok: "${title}" on ${branch}`);
