import { unstable_noStore as noStore } from 'next/cache';
import Image from 'next/image';
import { ComponentProps } from 'react';

import { getStrapiSource } from '@/lib/strapi/sourceMap';
import { API_URL, stripStegaMarkers } from '@/lib/utils';

interface StrapiMediaProps extends Omit<
  ComponentProps<typeof Image>,
  'src' | 'alt'
> {
  src: string;
  alt?: string | null;
}

export function getStrapiMedia(url: string | null) {
  if (url == null) return null;
  const cleanUrl = stripStegaMarkers(url);
  if (cleanUrl.startsWith('data:')) return cleanUrl;
  if (cleanUrl.startsWith('http') || cleanUrl.startsWith('//')) return cleanUrl;

  return API_URL + cleanUrl;
}

/**
 * Renders a Strapi media field. Every media field in the schema declares
 * `["images"]`, so an image is the only thing this can receive — see
 * `docs/adr/0010-media-fields-accept-only-images.md`.
 */
export function StrapiMedia({
  src,
  alt,
  className,
  ...imageProps
}: Readonly<StrapiMediaProps>) {
  noStore();

  // Decode the visual-editing source from the raw URL *before* getStrapiMedia
  // strips the markers, and render it as a literal data attribute the preview
  // overlay reads directly. Undefined outside draft mode -> attribute omitted.
  const strapiSource = getStrapiSource(src);

  const imageUrl = getStrapiMedia(src);
  if (!imageUrl) return null;
  return (
    <Image
      src={imageUrl}
      alt={alt ?? 'No alternative text provided'}
      className={className}
      data-strapi-source={strapiSource}
      {...imageProps}
    />
  );
}
