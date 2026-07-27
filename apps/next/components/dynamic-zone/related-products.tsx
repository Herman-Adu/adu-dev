import type { Block } from '@repo/strapi-types';
import React from 'react';

import { ProductItems } from '@/components/products/product-items';

type RelatedProductsProps = Block<'dynamic-zone.related-products'> & {
  locale: string;
};

export const RelatedProducts = ({
  heading,
  sub_heading,
  products,
  locale,
}: RelatedProductsProps) => {
  return (
    <div className="mt-10">
      <ProductItems
        heading={heading}
        sub_heading={sub_heading}
        products={products ?? []}
        locale={locale}
      />
    </div>
  );
};
