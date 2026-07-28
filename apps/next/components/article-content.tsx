'use client';

import {
  type BlocksContent,
  BlocksRenderer,
} from '@strapi/blocks-react-renderer';
import type { ComponentProps } from 'react';

import { BlurImage } from './blur-image';
import { resolveStrapiMedia } from '@/lib/strapi/media';
import { stripStegaMarkers } from '@/lib/utils';

type BlockComponents = NonNullable<
  ComponentProps<typeof BlocksRenderer>['blocks']
>;

const ImageBlock: BlockComponents['image'] = ({ image }) => (
  <BlurImage
    {...resolveStrapiMedia(image.url)}
    alt={stripStegaMarkers(image.alternativeText || image.name)}
    width={image.width}
    height={image.height}
    className="rounded-lg"
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
