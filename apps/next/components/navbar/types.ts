import type { Entry, Fieldset } from '@repo/strapi-types';

/**
 * Both navbars render the same two things, so the shapes live here rather than
 * being declared twice and drifting apart.
 *
 * `LogoEntry` is deliberately not called `Logo` — both navbars also import a
 * `Logo` *component*, and one name for two things reads ambiguously at the use
 * site.
 */
export type NavbarLink = Fieldset<'shared.link'>;
export type LogoEntry = Entry<'api::logo.logo'>;

export type NavbarProps = {
  leftNavbarItems: NavbarLink[];
  rightNavbarItems: NavbarLink[];
  logo: LogoEntry | null;
  locale: string;
};
