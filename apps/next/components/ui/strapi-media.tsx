import Image from 'next/image';
import { ComponentProps } from 'react';

import { resolveStrapiMedia } from '@/lib/strapi/media';

interface StrapiMediaProps extends Omit<
  ComponentProps<typeof Image>,
  'src' | 'alt'
> {
  src: string;
  alt?: string | null;
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
  const { src: imageUrl, ...sourceProps } = resolveStrapiMedia(src);
  if (imageUrl === '') return null;

  return (
    <Image
      src={imageUrl}
      alt={alt ?? 'No alternative text provided'}
      className={className}
      {...sourceProps}
      {...imageProps}
    />
  );
}
