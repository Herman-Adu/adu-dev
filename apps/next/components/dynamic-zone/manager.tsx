import type { Block, UID } from '@repo/strapi-types';
import React from 'react';

import { Brands } from './brands';
import { CTA } from './cta';
import { FAQ } from './faq';
import { Features } from './features';
import { FormNextToSection } from './form-next-to-section';
import { Hero } from './hero';
import { HowItWorks } from './how-it-works';
import { Launches } from './launches';
import { Pricing } from './pricing';
import { RelatedArticles } from './related-articles';
import { RelatedProducts } from './related-products';
import { Testimonials } from './testimonials';

/**
 * This is a Server Component, and the static imports above are what keep it one.
 *
 * Importing the Blocks through `next/dynamic` would force the directive back on,
 * and that matters more here than anywhere else in the app: this file is the root
 * of every dynamic zone, so a boundary here puts all twelve Blocks and everything
 * below them in the client bundle whether they need it or not.
 *
 * Static imports leave the boundary at whichever Blocks declare `'use client'`
 * themselves, and Next code-splits at each one. A Block that declares nothing —
 * CTA, related-articles, related-products — ships no client JS at all; one whose
 * children do, like how-it-works or testimonials, ships only those children
 * rather than itself and its whole subtree. The trade is explicit lazy-loading
 * for automatic splitting; the pull request for #44 has the measurement that
 * settled it.
 */

/**
 * A dynamic zone is a discriminated union: every entry carries the UID of the
 * Block it is, in `__component`. Deriving both from `UID.Component` means a
 * Block added to or removed from the schema changes this type, rather than
 * being silently accepted by an index signature.
 */
type DynamicZoneUid = Extract<UID.Component, `dynamic-zone.${string}`>;

export type DynamicZoneBlock = {
  [K in DynamicZoneUid]: Block<K> & { __component: K };
}[DynamicZoneUid];

interface Props {
  dynamicZone: DynamicZoneBlock[];
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
  'dynamic-zone.hero': Hero,
  'dynamic-zone.features': Features,
  'dynamic-zone.testimonials': Testimonials,
  'dynamic-zone.how-it-works': HowItWorks,
  'dynamic-zone.brands': Brands,
  'dynamic-zone.pricing': Pricing,
  'dynamic-zone.launches': Launches,
  'dynamic-zone.cta': CTA,
  'dynamic-zone.form-next-to-section': FormNextToSection,
  'dynamic-zone.faq': FAQ,
  'dynamic-zone.related-products': RelatedProducts,
  'dynamic-zone.related-articles': RelatedArticles,
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
