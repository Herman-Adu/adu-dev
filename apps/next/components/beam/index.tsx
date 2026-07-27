'use client';

import React, { useCallback } from 'react';

import styles from './styles.module.css';
import { cn } from '@/lib/utils';

const restartAnimation = (meteor: HTMLSpanElement) => {
  meteor.style.animation = 'none';
  void meteor.offsetWidth; // This forces a reflow, restarting the animation
  meteor.style.animation = '';
};

const Beam = ({
  showBeam = true,
  className,
}: {
  showBeam?: boolean;
  className?: string;
}) => {
  // These listeners belong to the node, not to the component, so they are
  // attached by the ref callback and torn down by the cleanup React 19 lets it
  // return. The span is only rendered when `showBeam`, so an effect keyed on
  // `showBeam` was re-checking something the tree had already decided.
  //
  // The identity must be stable. An inline callback is a new function every
  // render, so React detaches and reattaches on each one — and the CSS
  // animation does not restart to match, so an `animationstart` firing in the
  // gap is lost and the beam stays `visibility: hidden` forever. That is not
  // theoretical: it is what an unmemoized version of this did.
  const meteorRef = useCallback((meteor: HTMLSpanElement | null) => {
    if (meteor === null) return;

    const handleAnimationEnd = () => {
      meteor.style.visibility = 'hidden';
      const animationDelay = Math.floor(Math.random() * (2 - 0) + 0);
      const animationDuration = Math.floor(Math.random() * (4 - 0) + 0);
      const meteorWidth = Math.floor(Math.random() * (150 - 80) + 80);
      meteor.style.setProperty('--meteor-delay', `${animationDelay}s`);
      meteor.style.setProperty('--meteor-duration', `${animationDuration}s`);
      meteor.style.setProperty('--meteor-width', `${meteorWidth}px`);

      restartAnimation(meteor);
    };

    const handleAnimationStart = () => {
      meteor.style.visibility = 'visible';
    };

    meteor.addEventListener('animationend', handleAnimationEnd);
    meteor.addEventListener('animationstart', handleAnimationStart);

    return () => {
      meteor.removeEventListener('animationend', handleAnimationEnd);
      meteor.removeEventListener('animationstart', handleAnimationStart);
    };
  }, []);

  return (
    showBeam && (
      <span
        ref={meteorRef}
        className={cn(
          'absolute z-[40] -top-4  h-[0.1rem] w-[0.1rem] rounded-[9999px] bg-blue-700 shadow-[0_0_0_1px_#ffffff10] rotate-[180deg]',
          styles.meteor,
          className
        )}
      ></span>
    )
  );
};

export default Beam;
