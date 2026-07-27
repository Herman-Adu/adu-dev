'use client';

import type { Block } from '@repo/strapi-types';
import { IconSettings } from '@tabler/icons-react';
import React from 'react';

import { Container } from '../../container';
import { Heading } from '../../elements/heading';
import { Subheading } from '../../elements/subheading';
import { FeatureIconContainer } from '../features/feature-icon-container';
import { Card } from './card';

type HowItWorksProps = Block<'dynamic-zone.how-it-works'>;

export const HowItWorks = ({
  heading,
  sub_heading,
  steps,
}: HowItWorksProps) => {
  return (
    <div>
      <Container className="py-20 max-w-7xl mx-auto  relative z-40">
        <FeatureIconContainer className="flex justify-center items-center overflow-hidden">
          <IconSettings className="h-6 w-6 text-white" />
        </FeatureIconContainer>
        <Heading className="pt-4">{heading}</Heading>
        <Subheading className="max-w-3xl mx-auto">{sub_heading}</Subheading>

        {steps &&
          steps.map((item, index: number) => (
            <Card {...item} index={index + 1} key={item.id} />
          ))}
      </Container>
    </div>
  );
};
