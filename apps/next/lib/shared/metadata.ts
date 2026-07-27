import type { Fieldset } from '@repo/strapi-types';

import { strapiImage } from '../strapi/strapiImage';

/**
 * This previously read `seo.ogTitle`, `ogDescription`, `twitterCard`,
 * `twitterTitle`, `twitterDescription` and `twitterImage`. None of those exist
 * on `shared.seo`, so every one was permanently undefined and the `||`
 * fallbacks were the only live path — the code implied editors could override
 * the OG and Twitter cards separately, and they could not. The reads are gone
 * rather than being carried forward as decoration; adding the fields to the
 * schema is a content-model change and is tracked separately.
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
