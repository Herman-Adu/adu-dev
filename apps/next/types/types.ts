import type { Entry } from '@repo/strapi-types';

/**
 * Aliases, not copies: a schema change has to reach every consumer rather than
 * being absorbed by a duplicate that quietly drifts from it.
 */
export type Article = Entry<'api::article.article'>;
export type Product = Entry<'api::product.product'>;
export type Category = Entry<'api::category.category'>;
export type Testimonial = Entry<'api::testimonial.testimonial'>;

/**
 * Strapi generates media fields as `any`, so this is the shape the frontend
 * relies on rather than one the schema guarantees — the only type here not
 * backed by the generated definitions.
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
