import type { Entry } from '@repo/strapi-types';

/**
 * These were hand-written duplicates of content types the schema already
 * describes, and they had drifted: `Article` claimed a required `title` and
 * `slug` that the schema leaves optional, and `Product` typed six of its
 * fields as `any`. Aliasing the generated definitions means a schema change
 * reaches every consumer instead of being absorbed here.
 */
export type Article = Entry<'api::article.article'>;
export type Product = Entry<'api::product.product'>;
export type Category = Entry<'api::category.category'>;

/**
 * Strapi's generated types describe a media field as `any`, so this is the
 * shape the frontend relies on rather than one the schema guarantees. It is
 * the one place in this file still not backed by the generated types —
 * recorded in the pull request for #15.
 */
export interface Image {
  url: string;
  alternativeText: string;
  mime?: string;
}

export type LocaleParamsProps = {
  params: Promise<{
    locale: string;
  }>;
};

export type LocaleSlugParamsProps = {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
};
