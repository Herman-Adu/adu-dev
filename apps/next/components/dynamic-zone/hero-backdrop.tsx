'use client';

import { motion } from 'framer-motion';
import React from 'react';

import ShootingStars from '../decorations/shooting-star';
import StarBackground from '../decorations/star-background';

/**
 * The Hero's star field, faded in once after mount.
 *
 * This is the only part of the Hero that needs the client. Both decorations are
 * client components in their own right — they own a canvas and an animation
 * frame loop — and the fade is a framer-motion animation. Isolating the three
 * here is what lets the Hero itself stay a Server Component, so its heading,
 * subheading and CTAs render on the server and ship no JS.
 */
export const HeroBackdrop = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <StarBackground />
      <ShootingStars />
    </motion.div>
  );
};
