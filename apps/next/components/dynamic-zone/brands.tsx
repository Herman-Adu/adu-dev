import type { Block } from '@repo/strapi-types';

import { Heading } from '../elements/heading';
import { Subheading } from '../elements/subheading';
import { BrandsCarousel } from './brands-carousel';

type BrandsProps = Block<'dynamic-zone.brands'>;

export const Brands = ({ heading, sub_heading, logos }: BrandsProps) => {
  // The relation is optional in the schema, so an unpopulated or empty `logos`
  // reaches this component as null rather than an empty array.
  const allLogos = logos ?? [];

  return (
    <div className="relative z-20 py-10 md:py-40">
      <Heading className="pt-4">{heading}</Heading>
      <Subheading className="max-w-3xl mx-auto">{sub_heading}</Subheading>

      <BrandsCarousel logos={allLogos} />
    </div>
  );
};
