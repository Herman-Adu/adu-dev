'use client';

import type { Block, UID } from '@repo/strapi-types';
import dynamic from 'next/dynamic';
import React from 'react';

/**
 * A dynamic zone is a discriminated union: every entry carries the UID of the
 * Block it is, in `__component`. Deriving both from `UID.Component` means a
 * Block added to or removed from the schema changes this type, rather than
 * being silently accepted by an index signature.
 */
type DynamicZoneUid = Extract<UID.Component, `dynamic-zone.${string}`>;

export type DynamicZoneEntry = {
  [K in DynamicZoneUid]: Block<K> & { __component: K };
}[DynamicZoneUid];

interface Props {
  dynamicZone: DynamicZoneEntry[];
  locale: string;
}

/**
 * Keys are checked against the schema. The value cannot be, and this is a real
 * limit rather than a shortcut: props are contravariant, so a component taking
 * `HeroProps` is not assignable to one taking a wider type. No type but `any`
 * accepts all twelve differing Block components at once.
 *
 * The per-Block props are still enforced — inside each Block component, which
 * types its own props against the schema. What is unchecked is only the hand-off
 * here. Moving that check into this file needs a discriminated dispatch rather
 * than a lookup table; recorded in the pull request for #15.
 */
const componentMapping: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see above
  [K in DynamicZoneUid]?: React.ComponentType<any>;
} = {
  'dynamic-zone.hero': dynamic(() => import('./hero').then((mod) => mod.Hero)),
  'dynamic-zone.features': dynamic(() =>
    import('./features').then((mod) => mod.Features)
  ),
  'dynamic-zone.testimonials': dynamic(() =>
    import('./testimonials').then((mod) => mod.Testimonials)
  ),
  'dynamic-zone.how-it-works': dynamic(() =>
    import('./how-it-works').then((mod) => mod.HowItWorks)
  ),
  'dynamic-zone.brands': dynamic(() =>
    import('./brands').then((mod) => mod.Brands)
  ),
  'dynamic-zone.pricing': dynamic(() =>
    import('./pricing').then((mod) => mod.Pricing)
  ),
  'dynamic-zone.launches': dynamic(() =>
    import('./launches').then((mod) => mod.Launches)
  ),
  'dynamic-zone.cta': dynamic(() => import('./cta').then((mod) => mod.CTA)),
  'dynamic-zone.form-next-to-section': dynamic(() =>
    import('./form-next-to-section').then((mod) => mod.FormNextToSection)
  ),
  'dynamic-zone.faq': dynamic(() => import('./faq').then((mod) => mod.FAQ)),
  'dynamic-zone.related-products': dynamic(() =>
    import('./related-products').then((mod) => mod.RelatedProducts)
  ),
  'dynamic-zone.related-articles': dynamic(() =>
    import('./related-articles').then((mod) => mod.RelatedArticles)
  ),
};

const DynamicZoneManager: React.FC<Props> = ({ dynamicZone, locale }) => {
  return (
    <div>
      {dynamicZone.map((componentData, index) => {
        const Component = componentMapping[componentData.__component];
        if (!Component) {
          console.warn(`No component found for: ${componentData.__component}`);
          return null;
        }
        return (
          <Component
            key={`${componentData.__component}-${componentData.id}-${index}`}
            {...componentData}
            locale={locale}
          />
        );
      })}
    </div>
  );
};

export default DynamicZoneManager;
