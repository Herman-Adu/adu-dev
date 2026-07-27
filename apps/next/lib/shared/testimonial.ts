import type { Testimonial } from '@/types/types';

/**
 * A testimonial's `user` is optional, and so are both of its name parts, so a
 * testimonial can legitimately carry none of them. Joining only the parts that
 * are present keeps a missing first or last name from leaving a stray space.
 */
export const testimonialFullName = (testimonial: Testimonial): string =>
  [testimonial.user?.firstname, testimonial.user?.lastname]
    .filter((part) => part !== null && part !== undefined && part !== '')
    .join(' ');
