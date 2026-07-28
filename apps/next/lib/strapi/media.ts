import { API_URL, stripStegaMarkers } from '../utils';
import { getStrapiSource } from './sourceMap';

/**
 * Turns a Strapi media URL into something renderable. Reach for
 * `resolveStrapiMedia` when rendering an element — it adds the visual-editing
 * attribute that makes the live preview clickable. Use this one only where an
 * element is not involved, such as a CSS `url()` or an Open Graph tag.
 *
 * Deliberately pure: no caching side effects. Caching belongs to the fetch
 * layer, which drives `cacheTag`, `cacheLife` and `draftMode` in `client.ts`,
 * and splitting that decision across two places is how it stops being reviewable.
 *
 * **`/uploads/` paths are rebuilt against the current Strapi host, and that
 * deliberately outranks leaving an absolute URL alone.** Rich-text content
 * snapshots the media URL from the authoring environment, so
 * `http://localhost:1337/uploads/…` can be baked into a paragraph and still has
 * to render in production. The rule assumes uploads are served by Strapi itself.
 * A cloud upload provider whose CDN URLs also contain `/uploads/` would have its
 * host rewritten — and a presigned URL would lose nothing else, since the query
 * is preserved, but would still point at the wrong origin. That is the single
 * assumption to revisit before adopting one.
 */
export function strapiMediaUrl(url: string | null | undefined): string {
  if (url === null || url === undefined) return '';

  const cleanUrl = stripStegaMarkers(url);
  if (cleanUrl === '') return '';
  if (cleanUrl.startsWith('data:')) return cleanUrl;

  // Parsed against the Strapi origin so a relative path and an absolute one are
  // classified the same way. `new URL` with a base succeeds for almost any
  // string, including a bare filename, so the catch is a genuine last resort —
  // it fires only when API_URL is set to something that is not a valid origin.
  let parsed: URL;
  try {
    parsed = new URL(cleanUrl, API_URL || 'http://localhost');
  } catch {
    return cleanUrl;
  }

  if (parsed.pathname.startsWith('/uploads/')) {
    return API_URL + parsed.pathname + parsed.search + parsed.hash;
  }

  // Absolute and not an upload: it belongs to someone else, so leave it alone.
  if (cleanUrl.startsWith('//') || cleanUrl.startsWith('http')) return cleanUrl;
  if (cleanUrl.startsWith('/')) return API_URL + cleanUrl;

  return cleanUrl;
}

/**
 * Resolve a raw Strapi media URL into the props an image element needs to be
 * both displayable AND click-to-edit in the live preview:
 *  - `src`: the resolved URL
 *  - `data-strapi-source`: the visual-editing field mapping, decoded from the
 *    RAW url *before* cleaning strips it (undefined outside draft mode, so the
 *    attribute is simply omitted in production)
 *
 * Spread directly onto the element so the source mapping can't be forgotten:
 *   <BlurImage {...resolveStrapiMedia(image.url)} alt={...} width={...} />
 */
export function resolveStrapiMedia(url: string | null | undefined) {
  return {
    src: strapiMediaUrl(url),
    'data-strapi-source': getStrapiSource(url),
  };
}
