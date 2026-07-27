import type { Block } from '@repo/strapi-types';
import React from 'react';

import { BlogCardVertical } from '../blog-card';

type RelatedArticlesProps = Block<'dynamic-zone.related-articles'> & {
  locale: string;
};

export const RelatedArticles = ({
  heading,
  articles,
  locale,
}: RelatedArticlesProps) => {
  return (
    <div className="mt-12 pb-20">
      <h2 className="text-2xl font-bold text-neutral-200 mb-10">{heading}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {(articles ?? []).map((article) => (
          <BlogCardVertical
            key={article.documentId}
            article={article}
            locale={locale}
          />
        ))}
      </div>
    </div>
  );
};
