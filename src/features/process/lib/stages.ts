/**
 * Scene 03 — the four layers of a build, in the order they peel apart.
 *
 * Copy from the Home board's "The build, end to end"; the layer names are
 * the Scroll spine's own (motion, contract, feature, infra). Static site
 * copy, so a typed const rather than a contract — the same call as
 * `nav-links.ts`. It gets a contract when it becomes editable.
 */
export interface BuildLayer {
  /** Ordinal, shown in mono. */
  n: string;
  /** The spine's name for the layer. Lands as the plate settles. */
  layer: string;
  title: string;
  body: string;
}

export const BUILD_LAYERS: readonly BuildLayer[] = [
  {
    n: "01",
    layer: "motion",
    title: "Motion-first design",
    body: "Storyboarded on a canvas before a line of code. Scenes, scrub ranges, reduced-motion fallbacks.",
  },
  {
    n: "02",
    layer: "contract",
    title: "Typed contracts",
    body: "Schemas first. The data shape is the agreement; the CMS is just one implementation of it.",
  },
  {
    n: "03",
    layer: "feature",
    title: "Feature-owned code",
    body: "Each feature owns its actions, schemas and components. Shared UI stays dumb and tiny.",
  },
  {
    n: "04",
    layer: "infra",
    title: "Yours to keep",
    body: "Your repo, your Postgres, your domain. Swap the back end without touching the front.",
  },
] as const;
