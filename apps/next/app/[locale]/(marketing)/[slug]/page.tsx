import type { Entry } from '@repo/strapi-types';
import { Metadata } from 'next';

import ClientSlugHandler from '../ClientSlugHandler';
import PageContent from '@/lib/shared/PageContent';
import { buildLocalizedSlugs } from '@/lib/shared/localized-slugs';
import { generateMetadataObject } from '@/lib/shared/metadata';
import { fetchCollectionType } from '@/lib/strapi';
import type { LocaleSlugParamsProps } from '@/types/types';

type Page = Entry<'api::page.page'>;

export async function generateMetadata({
  params,
}: LocaleSlugParamsProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const [pageData] = await fetchCollectionType<Page[]>('pages', {
    filters: {
      slug: {
        $eq: slug,
      },
      locale: locale,
    },
  });

  const seo = pageData.seo;
  const metadata = generateMetadataObject(seo);
  return metadata;
}

export default async function Page({ params }: LocaleSlugParamsProps) {
  const { slug, locale } = await params;
  const [pageData] = await fetchCollectionType<Page[]>('pages', {
    filters: {
      slug: {
        $eq: slug,
      },
      locale: locale,
    },
  });

  const localizedSlugs = buildLocalizedSlugs(pageData.localizations, {
    locale,
    slug,
  });

  return (
    <>
      <ClientSlugHandler localizedSlugs={localizedSlugs} />
      <PageContent pageData={pageData} />
    </>
  );
}
