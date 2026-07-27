'use client';

import type { Entry, Fieldset } from '@repo/strapi-types';
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from 'framer-motion';
import { Link } from 'next-view-transitions';
import { useState } from 'react';

import { LocaleSwitcher } from '../locale-switcher';
import { NavbarItem } from './navbar-item';
import { Button } from '@/components/elements/button';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';

// Both navbars render `shared.link` entries and the `api::logo.logo` relation
// the global navbar points at, rather than hand-copied shapes of them.
type NavbarLink = Fieldset<'shared.link'>;
type Logo = Entry<'api::logo.logo'>;

type Props = {
  leftNavbarItems: NavbarLink[];
  rightNavbarItems: NavbarLink[];
  logo: Logo | null;
  locale: string;
};

export const DesktopNavbar = ({
  leftNavbarItems,
  rightNavbarItems,
  logo,
  locale,
}: Props) => {
  const { scrollY } = useScroll();

  const [showBackground, setShowBackground] = useState(false);

  useMotionValueEvent(scrollY, 'change', (value) => {
    if (value > 100) {
      setShowBackground(true);
    } else {
      setShowBackground(false);
    }
  });
  return (
    <motion.div
      className={cn(
        'w-full flex relative justify-between px-4 py-3 rounded-md  transition duration-200 bg-transparent mx-auto'
      )}
      animate={{
        width: showBackground ? '80%' : '100%',
        background: showBackground ? 'var(--neutral-900)' : 'transparent',
      }}
      transition={{
        duration: 0.4,
      }}
    >
      <AnimatePresence>
        {showBackground && (
          <motion.div
            key={String(showBackground)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 1,
            }}
            className="absolute inset-0 h-full w-full bg-neutral-900 pointer-events-none [mask-image:linear-gradient(to_bottom,white,transparent,white)] rounded-full"
          />
        )}
      </AnimatePresence>
      <div className="flex flex-row gap-2 items-center">
        <Logo locale={locale} image={logo?.image} />
        <div className="flex items-center gap-1.5">
          {leftNavbarItems.map((item) => (
            <NavbarItem
              href={`/${locale}${item.URL}` as never}
              key={item.text}
              target={item.target ?? undefined}
            >
              {item.text}
            </NavbarItem>
          ))}
        </div>
      </div>
      <div className="flex space-x-2 items-center">
        <LocaleSwitcher currentLocale={locale} />

        {rightNavbarItems.map((item, index) => (
          <Button
            key={item.text}
            variant={
              index === rightNavbarItems.length - 1 ? 'primary' : 'simple'
            }
            as={Link}
            href={`/${locale}${item.URL}`}
          >
            {item.text}
          </Button>
        ))}
      </div>
    </motion.div>
  );
};
