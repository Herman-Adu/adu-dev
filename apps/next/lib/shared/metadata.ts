import type { Fieldset } from '@repo/strapi-types';

import { strapiImage } from '../strapi/strapiImage';

/**
 * `shared.seo` has no per-network override fields, so the OG and Twitter cards
 * are derived from the shared `meta*` ones. Adding real overrides is a
 * content-model change, tracked in #40.
 *
 * Note the Twitter card now carries `metaImage`, which it did not before: it
 * read a `twitterImage` field that does not exist, so the image was always
 * empty. Using `metaImage` matches what `openGraph` above already does.
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
      images: seo?.metaImage ? [{ url: strapiImage(seo?.metaImage.url) }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo?.metaTitle || 'Default Twitter Title',
      description: seo?.metaDescription || 'Default Twitter Description',
      images: seo?.metaImage ? [{ url: strapiImage(seo?.metaImage.url) }] : [],
    },
  };
}
