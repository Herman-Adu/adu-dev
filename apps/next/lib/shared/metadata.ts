import type { Fieldset } from '@repo/strapi-types';

import { strapiMediaUrl } from '../strapi/media';

/**
 * `shared.seo` has no per-network override fields, so the OG and Twitter cards
 * are derived from the shared `meta*` ones. That is a decision rather than a
 * gap — see `docs/adr/0009-seo-mirrors-one-set-of-fields.md`, which also names
 * what would reopen it.
 *
 * Note the Twitter card carries `metaImage`. It previously read a `twitterImage`
 * field that does not exist, so the image was always empty; `metaImage` matches
 * what `openGraph` already does.
 */
export function generateMetadataObject(
  seo: Fieldset<'shared.seo'> | null | undefined
) {
  return {
    title: seo?.metaTitle || 'Default Title', // Fallback to 'Default Title' if title is not provided
    description: seo?.metaDescription || 'Default Description', // Fallback to 'Default Description'
    openGraph: {
      title: seo?.metaTitle || 'Default OG Title',
      description: seo?.metaDescription || 'Default OG Description',
      images: seo?.metaImage
        ? [{ url: strapiMediaUrl(seo?.metaImage.url) }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo?.metaTitle || 'Default Twitter Title',
      description: seo?.metaDescription || 'Default Twitter Description',
      images: seo?.metaImage
        ? [{ url: strapiMediaUrl(seo?.metaImage.url) }]
        : [],
    },
  };
}
