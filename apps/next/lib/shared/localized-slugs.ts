/**
 * Builds the locale → slug map the locale switcher reads.
 *
 * `locale` and `slug` are optional on a localization, and `localizations`
 * itself can be absent, so the guards live here once rather than in each of
 * the six routes that need them.
 *
 * The current locale is always seeded. One route previously ended `|| {}` and
 * so returned an empty map when `localizations` was absent, leaving the
 * switcher without even the page it was on; the other five seeded it.
 */
type Localization = {
  locale?: string | null;
  slug?: string | null;
};

export function buildLocalizedSlugs(
  localizations: readonly Localization[] | null | undefined,
  current: { locale: string; slug: string },
  /**
   * How to read the slug for a localization. Defaults to the entry's own slug;
   * routes whose path segment is fixed (`/blog`, `/products`) pass a constant.
   */
  resolveSlug: (localization: Localization) => string | null | undefined = (
    localization
  ) => localization.slug
): Record<string, string> {
  const slugs: Record<string, string> = { [current.locale]: current.slug };

  for (const localization of localizations ?? []) {
    const locale = localization.locale;
    if (locale === null || locale === undefined) continue;

    const slug = resolveSlug(localization);
    if (slug === null || slug === undefined) continue;

    slugs[locale] = slug;
  }

  return slugs;
}
