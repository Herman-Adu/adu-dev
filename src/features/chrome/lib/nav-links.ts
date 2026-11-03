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
}

export const NAV_LINKS: readonly NavLink[] = [
  { href: "/work", label: "Work" },
  { href: "/services", label: "Services" },
  { href: "/platform", label: "Platform" },
  { href: "/writing", label: "Writing" },
] as const;

/** The bordered CTA at the right of the bar. */
export const PRIMARY_CTA: NavLink = { href: "/contact", label: "Start a build" };
