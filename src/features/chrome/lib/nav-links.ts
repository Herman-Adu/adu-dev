/**
 * Primary navigation, in the order the Home board sets it.
 *
 * Site chrome, not CMS content — so this is a plain typed const rather than
 * a contract. If navigation ever becomes editable, it gets a contract.ts of
 * its own and this file becomes the local adapter.
 */
export interface NavLink {
  href: string;
  label: string;
  /**
   * Whether the page behind it exists. A nav that links to a 404 is worse
   * than a nav with fewer links, so unready entries are not rendered. Flip
   * the flag in the same PR that adds the route.
   */
  ready: boolean;
}

export const NAV_LINKS: readonly NavLink[] = [
  { href: "/work", label: "Work", ready: true },
  { href: "/services", label: "Services", ready: true },
  { href: "/platform", label: "Platform", ready: true },
  { href: "/writing", label: "Writing", ready: false },
] as const;

/** The bordered CTA at the right of the bar. */
export const PRIMARY_CTA: NavLink = {
  href: "/contact",
  label: "Start a build",
  ready: true,
};
