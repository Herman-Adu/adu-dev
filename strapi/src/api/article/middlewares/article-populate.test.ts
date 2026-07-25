import { expect, test } from 'vitest';

import createArticlePopulate from './article-populate';

const runMiddleware = async () => {
  const middleware = createArticlePopulate({}, { strapi: {} as never });
  const ctx = { query: {} as Record<string, unknown> };
  let downstreamRan = false;
  await middleware(ctx, async () => {
    downstreamRan = true;
  });
  return { ctx, downstreamRan };
};

test('article requests reach the handler with media and localizations populated', async () => {
  const { ctx, downstreamRan } = await runMiddleware();
  const populate = ctx.query.populate as Record<string, unknown>;

  expect(downstreamRan).toBe(true);
  expect(populate.image).toBe(true);
  expect(populate.localizations).toBe(true);
});

test('article requests populate SEO meta images and CTA dynamic-zone content', async () => {
  const { ctx } = await runMiddleware();
  const populate = ctx.query.populate as {
    seo: unknown;
    dynamic_zone: { on: Record<string, unknown> };
  };

  expect(populate.seo).toEqual({ populate: { metaImage: true } });
  expect(populate.dynamic_zone.on['dynamic-zone.cta']).toEqual({
    populate: { CTAs: true },
  });
});
