import ClientSlugHandler from '../../ClientSlugHandler';
import { ArticleContent } from '@/components/article-content';
import { BlogLayout } from '@/components/blog-layout';
import { buildLocalizedSlugs } from '@/lib/shared/localized-slugs';
import { fetchCollectionType } from '@/lib/strapi';
import type { Article, LocaleSlugParamsProps } from '@/types/types';

export default async function SingleArticlePage({
  params,
}: LocaleSlugParamsProps) {
  const { slug, locale } = await params;
  const [article] = await fetchCollectionType<Article[]>('articles', {
    filters: {
      slug: {
        $eq: slug,
      },
    },
    locale,
  });

  if (!article) {
    return <div>Blog not found</div>;
  }

  const localizedSlugs = buildLocalizedSlugs(article.localizations, {
    locale,
    slug,
  });

  return (
    <BlogLayout article={article} locale={locale}>
      <ClientSlugHandler localizedSlugs={localizedSlugs} />
      <ArticleContent content={article.content} />
    </BlogLayout>
  );
}
