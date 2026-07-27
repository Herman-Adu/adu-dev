/**
 * Builds the locale → slug map the locale switcher reads.
 *
 * Six routes were each reducing over `localizations` with the same block and
 * the same `localization: any`, differing only in whether the slug came from
 * the entry or was a fixed path segment. Strapi types `locale` and `slug` as
 * optional, and `localizations` itself can be absent, so every one of those
 * copies had to get the same three guards right independently.
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
