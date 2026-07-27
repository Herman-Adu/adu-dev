'use client';

import type { Block } from '@repo/strapi-types';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { StrapiMedia } from '@/components/ui/strapi-media';

type BrandLogos = NonNullable<Block<'dynamic-zone.brands'>['logos']>;

/**
 * The half of the Brands Block that alternates. Only the rotation needs the
 * client, so the Block's heading and subheading stay on the server.
 */
export const BrandsCarousel = ({ logos }: { logos: BrandLogos }) => {
  // `ceil`, not `floor`: the first half is what renders before any flip, so an
  // odd logo belongs there. With `floor` a single logo lands entirely in the
  // second half, leaving the first empty — and since the interval below does not
  // run under two logos, nothing ever swaps it in and the row stays blank.
  const middleIndex = Math.ceil(logos.length / 2);
  const firstHalf = logos.slice(0, middleIndex);
  const secondHalf = logos.slice(middleIndex);
  const logosArraySplitInHalf = [firstHalf, secondHalf];

  // Which half is on screen. The halves are derived during render, so the index
  // is the only state there is.
  const [activeHalf, setActiveHalf] = useState(0);
  const activeLogoSet = logosArraySplitInHalf[activeHalf];

  // Kept: an interval is scheduling, with no render-phase equivalent. The
  // hazard is a timer outliving the component, so the cleanup clears it.
  //
  // Below two logos there is nothing to alternate — the single logo is the whole
  // first half and the second is empty, so flipping would blank the row every 3s.
  useEffect(() => {
    if (logos.length < 2) return;
    const timer = setInterval(() => {
      setActiveHalf((current) => (current + 1) % 2);
    }, 3000);
    return () => clearInterval(timer);
  }, [logos.length]);

  return (
    <div className="flex gap-10 flex-wrap justify-center md:gap-40 relative h-full w-full mt-20">
      <AnimatePresence mode="popLayout">
        {activeLogoSet.map((logo, idx) => (
          <motion.div
            initial={{
              y: 40,
              opacity: 0,
              filter: 'blur(10px)',
            }}
            animate={{
              y: 0,
              opacity: 1,
              filter: 'blur(0px)',
            }}
            exit={{
              y: -40,
              opacity: 0,
              filter: 'blur(10px)',
            }}
            transition={{
              duration: 0.8,
              delay: 0.1 * idx,
              ease: [0.4, 0, 0.2, 1],
            }}
            key={logo.id}
            className="relative"
          >
            <StrapiMedia
              src={logo.image?.url}
              alt={logo.image.alternativeText}
              width={400}
              height={400}
              className="md:h-20 md:w-60 h-10 w-40 object-contain filter"
              draggable={false}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
