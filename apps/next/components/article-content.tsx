'use client';

import {
  type BlocksContent,
  BlocksRenderer,
} from '@strapi/blocks-react-renderer';
import type { ComponentProps } from 'react';

import { BlurImage } from './blur-image';
import { getStrapiSource } from '@/lib/strapi/sourceMap';
import { normalizeStrapiMediaUrl, stripStegaMarkers } from '@/lib/utils';

type BlockComponents = NonNullable<
  ComponentProps<typeof BlocksRenderer>['blocks']
>;

const ImageBlock: BlockComponents['image'] = ({ image }) => (
  <BlurImage
    src={normalizeStrapiMediaUrl(image.url)}
    alt={stripStegaMarkers(image.alternativeText || image.name)}
    width={image.width}
    height={image.height}
    className="rounded-lg"
    // Decode from the raw url before normalizeStrapiMediaUrl cleans it, so the
    // preview overlay can map this block image back to its media field.
    data-strapi-source={getStrapiSource(image.url)}
  />
);

// The Blocks field is optional in the schema, so an article can legitimately
// have no body yet. Rendering nothing beats the renderer receiving undefined.
export const ArticleContent = ({
  content,
}: {
  content: BlocksContent | null | undefined;
}) => {
  if (content === null || content === undefined) return null;
  return <BlocksRenderer content={content} blocks={{ image: ImageBlock }} />;
};
