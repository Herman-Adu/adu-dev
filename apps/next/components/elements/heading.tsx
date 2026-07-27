// This file declares no directive, so it compiles into whichever graph imports
// it — server and client both. `MotionProps` is used only in a type position, so
// `import type` keeps framer-motion out of the server one.
import type { MotionProps } from 'framer-motion';
import React from 'react';

import { cn } from '@/lib/utils';

// A Heading renders a heading element. `React.ElementType` would permit a div
// and, being fully generic, collapses `children` to `never` at the render site.
type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export const Heading = ({
  className,
  as: Tag = 'h2',
  children,
  size = 'md',
  ...props
}: {
  className?: string;
  as?: HeadingTag;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'xl' | '2xl';
  props?: React.HTMLAttributes<HTMLHeadingElement>;
} & MotionProps &
  React.HTMLAttributes<HTMLHeadingElement>) => {
  const sizeVariants = {
    sm: 'text-xl md:text-2xl md:leading-snug',
    md: 'text-3xl md:text-4xl md:leading-tight',
    xl: 'text-4xl md:text-6xl md:leading-none',
    '2xl': 'text-5xl md:text-7xl md:leading-none',
  };
  return (
    <Tag
      className={cn(
        'text-3xl md:text-5xl md:leading-tight max-w-5xl mx-auto text-center tracking-tight',
        'font-medium text-balance',
        'bg-clip-text text-transparent bg-gradient-to-b from-neutral-800 via-white to-white',
        sizeVariants[size],
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
};
