#!/usr/bin/env node
/**
 * The house rules that break silently, as a gate.
 *
 * Everything here passes `tsc` and `next build` while still being wrong, so
 * a type-checker will never catch it and a reviewer has to remember to look.
 * Rules that need judgement stay in the PR template and /house-review; only
 * the mechanically decidable ones live here.
 *
 *   npm run house-rules
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const failures = [];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const files = walk(join(ROOT, "src")).map((f) => ({
  path: relative(ROOT, f),
  text: readFileSync(f, "utf8"),
}));

/** Report every line matching `re`, unless `allow` excuses the file. */
function forbid({ rule, why, re, include = /\.(ts|tsx|css)$/, allow = () => false }) {
  for (const { path, text } of files) {
    if (!include.test(path) || allow(path)) continue;
    text.split("\n").forEach((line, i) => {
      // A rule quoted in a comment is documentation, not a violation.
      if (/^\s*(\{\s*)?(\/\/|\/\*|\*)/.test(line)) return;
      if (re.test(line)) {
        failures.push(`${rule}\n    ${path}:${i + 1}  ${line.trim()}\n    ${why}`);
      }
    });
  }
}

// --- Architecture --------------------------------------------------------

forbid({
  rule: "global imports a feature",
  why: "The dependency runs one way. src/global holds atoms with zero domain knowledge.",
  re: /from\s+["']@\/features\//,
  allow: (p) => !p.startsWith("src/global/"),
});

forbid({
  rule: "deep cross-feature import",
  why: "Cross-feature imports land on a feature's lib/index.ts, never below it.",
  re: /from\s+["']@\/features\/[a-z-]+\/(components|data)\/|from\s+["']@\/features\/[a-z-]+\/lib\/[a-z]/,
});

// --- Brand ---------------------------------------------------------------

forbid({
  rule: "white ink on brand",
  why: "Ink on brand is --color-ground. White on #F47C00 is 2.7:1 and fails AA at every size.",
  re: /bg-brand(?![-\w])(?!.*text-ground)/,
});

forbid({
  rule: "pill radius",
  why: "2px controls, 4px panels. Nothing pill-shaped.",
  re: /rounded-full/,
});

forbid({
  rule: "raw hex outside the token sheet",
  why: "Colours come from @theme. Three.js materials are the one exception, since WebGL cannot read a CSS variable.",
  re: /#[0-9a-fA-F]{6}\b/,
  include: /\.(ts|tsx)$/,
  allow: (p) => p.endsWith("forge-config.ts"),
});

forbid({
  rule: "placeholder rendered to the DOM",
  why: "A bracket is a note to ourselves, not copy. Drop the clause until the real value exists.",
  re: />[^<]*\[[A-Z][A-Z ./]{2,}\]/,
  include: /\.tsx$/,
});

// --- Contrast: the token sheet against the table in CLAUDE.md ------------

const srgb = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return (
    0.2126 * srgb((n >> 16) & 255) +
    0.7152 * srgb((n >> 8) & 255) +
    0.0722 * srgb(n & 255)
  );
};
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const css = readFileSync(join(ROOT, "src/app/globals.css"), "utf8");
const claude = readFileSync(join(ROOT, "CLAUDE.md"), "utf8");

const cssTokens = new Map(
  [...css.matchAll(/(--color-[a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [
    m[1],
    m[2].toLowerCase(),
  ]),
);
const ground = cssTokens.get("--color-ground");

// Every colour token carries a row. A token the table never mentions is the
// one the loop below can never check, which is how ink-mute shipped unlisted.
const tabled = new Set(
  [...claude.matchAll(/\|\s*`(--color-[a-z0-9-]+)`\s*\|/g)].map((m) => m[1]),
);
for (const token of cssTokens.keys()) {
  if (!tabled.has(token)) {
    failures.push(
      `colour token missing from the brand table\n    ${token}  ${cssTokens.get(token)}\n    Add a row to CLAUDE.md with its measured ratio, or the gate cannot check it.`,
    );
  }
}

for (const m of claude.matchAll(
  /\|\s*`(--color-[a-z0-9-]+)`\s*\|\s*`(#[0-9a-fA-F]{6})`\s*\|\s*([\d.]+):1\s*\|/g,
)) {
  const [, token, tableHex, stated] = m;
  const cssHex = cssTokens.get(token);

  if (!cssHex) {
    failures.push(
      `brand table names a token that is not in @theme\n    CLAUDE.md  ${token}\n    Every row mirrors src/app/globals.css.`,
    );
    continue;
  }
  if (cssHex !== tableHex.toLowerCase()) {
    failures.push(
      `brand table drifted from the token sheet\n    ${token}  table ${tableHex} vs css ${cssHex}\n    The table is what a reviewer reads. Keep it true.`,
    );
    continue;
  }
  const real = ratio(cssHex, ground);
  if (Math.abs(real - Number(stated)) > 0.1) {
    failures.push(
      `brand table states the wrong contrast\n    ${token}  states ${stated}:1, measures ${real.toFixed(2)}:1\n    Measure, never eyeball.`,
    );
  }
  if (real < 3) {
    failures.push(
      `token fails the large-text floor\n    ${token}  ${cssHex} on ${ground} is ${real.toFixed(2)}:1\n    3:1 is the floor at any size. Pick a shade that passes.`,
    );
  }
}

// --- Report --------------------------------------------------------------

if (failures.length > 0) {
  console.error(`\nHouse rules: ${failures.length} violation(s)\n`);
  for (const f of failures) console.error(`  ${f}\n`);
  process.exit(1);
}
console.log("House rules: clean.");
