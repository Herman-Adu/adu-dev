import { MotionProps } from 'framer-motion';
import React from 'react';
import Balancer from 'react-wrap-balancer';

import { cn } from '@/lib/utils';

// A subheading is a heading or the paragraph that follows one — not any element.
type SubheadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';

export const Subheading = ({
  className,
  as: Tag = 'h2',
  children,
}: {
  className?: string;
  as?: SubheadingTag;
  children: React.ReactNode;
  props?: React.HTMLAttributes<HTMLHeadingElement>;
} & MotionProps &
  React.HTMLAttributes<HTMLHeadingElement>) => {
  return (
    <Tag
      className={cn(
        'text-sm md:text-base  max-w-4xl text-left my-4 mx-auto',
        'text-muted text-center font-normal',
        className
      )}
    >
      <Balancer>{children}</Balancer>
    </Tag>
  );
};
