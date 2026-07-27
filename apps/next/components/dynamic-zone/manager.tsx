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
 * This is a Server Component, and the static imports above are what make it one.
 *
 * It used to be `'use client'` with twelve `next/dynamic` calls. Nothing in this
 * file needs the client — the directive was there only because `dynamic()` was.
 * The cost was that the boundary sat here, at the root of every dynamic zone, so
 * all twelve Blocks and everything below them joined the client bundle whether
 * they needed it or not.
 *
 * With static imports the boundary moves down to whichever Blocks actually
 * declare `'use client'`, and Next code-splits at each one. Blocks that are
 * wholly server — CTA, how-it-works, testimonials, related-*, form-next-to-
 * section, features — now ship no client JS at all rather than a lazy chunk
 * each. That trades explicit lazy-loading for automatic splitting; see the pull
 * request for #44 for the before/after measurement that settled it.
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
