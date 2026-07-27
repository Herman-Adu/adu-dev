'use client';

import { useEffect } from 'react';

import { useSlugContext } from '@/app/context/SlugContext';

export default function ClientSlugHandler({
  localizedSlugs,
}: {
  localizedSlugs: Record<string, string>;
}) {
  const { dispatch } = useSlugContext();

  // Kept, against this ticket's own classification. The slugs are computed per
  // route by a Server Component, and the only consumer is the locale switcher
  // in the navbar — which sits in the root layout, above every page. Props
  // cannot be threaded upwards, and a child may not set an ancestor's state
  // during render, so there is no render-phase way to move this value. The
  // hazard is a stale write: it must re-run when the route changes, which is
  // what keying it on `localizedSlugs` does. See ADR 0008.
  useEffect(() => {
    if (localizedSlugs) {
      dispatch({ type: 'SET_SLUGS', payload: localizedSlugs });
    }
  }, [localizedSlugs, dispatch]);

  return null; // This component only handles the state and doesn't render anything.
}
