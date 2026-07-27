import { ClassValue, clsx } from 'clsx';
import { format } from 'date-fns';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const truncate = (text: string | null | undefined, length: number) => {
  if (!text) return '';
  return text.length > length ? text.slice(0, length) + '...' : text;
};

// `price` is optional in the schema, so a product can legitimately reach this
// with no number at all. Returning '' rather than formatting `undefined`
// follows `truncate` above, and keeps "NaN" off the page.
export const formatNumber = (
  number: number | null | undefined,
  locale: string = 'en-US'
): string => {
  if (number === null || number === undefined) return '';
  return new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(number);
};

// Strapi's date fields are optional, so an unpublished or draft entry reaches
// the frontend with no `publishedAt` at all. `new Date(undefined)` is an
// Invalid Date and date-fns `format` throws a RangeError on one, so the four
// call sites that render a publish date go through here instead.
export const formatDate = (
  value: string | number | Date | null | undefined,
  pattern: string = 'MMMM dd, yyyy'
): string => {
  if (value === null || value === undefined) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return format(date, pattern);
};

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (globalThis.document?.location.host.endsWith('.strapidemo.com')
    ? `https://${document.location.host.replace('client-', 'api-')}`
    : '');

// Strapi's content source maps (sent in draft mode) append invisible stega
// markers to every string so the admin preview can locate fields in the DOM.
// They are only valid inside visible text nodes — in URLs or other attributes
// they get percent-encoded (breaking the URL) and cause hydration mismatches.
export const stripStegaMarkers = (value: string): string =>
  value.replace(/[\u200B-\u200D\u2060\uFEFF]/g, '');

// Blocks (rich text) content snapshots the media URL from the authoring
// environment (e.g. http://localhost:1337/uploads/...), so any /uploads/
// path must be rebuilt against the current Strapi host before rendering.
export const normalizeStrapiMediaUrl = (url: string): string => {
  const cleanUrl = stripStegaMarkers(url);
  try {
    const { pathname } = new URL(cleanUrl, API_URL || 'http://localhost');
    if (pathname.startsWith('/uploads/')) {
      return API_URL + pathname;
    }
  } catch {
    // not a parseable URL; render it unchanged
  }
  return cleanUrl;
};
