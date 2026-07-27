'use client';

import type { Block } from '@repo/strapi-types';
import { motion } from 'framer-motion';
import Link from 'next/link';
import React from 'react';

import { Container } from '../container';
import { AmbientColor } from '../decorations/ambient-color';
import { Button } from '../elements/button';

type CTAProps = Block<'dynamic-zone.cta'> & { locale: string };

export const CTA = ({ heading, sub_heading, CTAs, locale }: CTAProps) => {
  return (
    <div className="relative py-40">
      <AmbientColor />
      <Container className="flex flex-col md:flex-row justify-between items-center w-full px-8">
        <div className="flex flex-col">
          <motion.h2 className="text-white text-xl text-center md:text-left md:text-3xl font-bold mx-auto md:mx-0 max-w-xl ">
            {heading}
          </motion.h2>
          <p className="max-w-md mt-8 text-center md:text-left text-sm md:text-base mx-auto md:mx-0 text-neutral-400">
            {sub_heading}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {CTAs &&
            CTAs.map((cta) => (
              <Button
                as={Link}
                key={cta.id}
                href={`/${locale}${cta.URL}`}
                {...(cta.variant === null || cta.variant === undefined
                  ? {}
                  : { variant: cta.variant })}
                className="py-3"
              >
                {cta.text}
              </Button>
            ))}
        </div>
      </Container>
    </div>
  );
};
