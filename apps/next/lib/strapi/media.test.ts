import { afterEach, describe, expect, test, vi } from 'vitest';

import { resolveStrapiMedia, strapiMediaUrl } from './media';

// NEXT_PUBLIC_API_URL is unset here, so API_URL is '' and a rebuilt path stays
// root-relative. The suite below this one sets a host, because with an empty
// API_URL a rebuild is indistinguishable from a passthrough.
describe('strapiMediaUrl (no NEXT_PUBLIC_API_URL configured)', () => {
  test('returns an empty string for null or undefined', () => {
    expect(strapiMediaUrl(null)).toBe('');
    expect(strapiMediaUrl(undefined)).toBe('');
  });

  test('strips the invisible stega markers draft mode injects', () => {
    // Unstripped, the marker survives into the path as %E2%80%8B.
    expect(strapiMediaUrl('/uploads/i​mg.png')).toBe('/uploads/img.png');
  });

  test('passes a data: URI through untouched', () => {
    expect(strapiMediaUrl('data:image/png;base64,iVBORw0KGgo=')).toBe(
      'data:image/png;base64,iVBORw0KGgo='
    );
  });

  test('leaves an absolute non-uploads URL alone', () => {
    expect(strapiMediaUrl('https://cdn.example.com/logo.png')).toBe(
      'https://cdn.example.com/logo.png'
    );
  });

  test('leaves a protocol-relative non-uploads URL alone', () => {
    expect(strapiMediaUrl('//cdn.example.com/logo.png')).toBe(
      '//cdn.example.com/logo.png'
    );
  });

  test('renders non-URL strings unchanged', () => {
    expect(strapiMediaUrl('not a url')).toBe('not a url');
  });
});

// The rebuild is the one behaviour that cannot be observed without a host, and
// it is also the one that outranks leaving an absolute URL alone. API_URL is
// read at module load, so the module is re-imported after stubbing the env.
describe('strapiMediaUrl (NEXT_PUBLIC_API_URL configured)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  const withHost = async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://cms.example.com');
    vi.resetModules();
    return (await import('./media')).strapiMediaUrl;
  };

  test('rebuilds a relative /uploads/ path onto the Strapi host', async () => {
    const resolve = await withHost();
    expect(resolve('/uploads/img.png')).toBe(
      'https://cms.example.com/uploads/img.png'
    );
  });

  test('rebuilds an /uploads/ URL that arrived with the authoring host', async () => {
    const resolve = await withHost();
    expect(resolve('http://localhost:1337/uploads/img.png')).toBe(
      'https://cms.example.com/uploads/img.png'
    );
  });

  test('rebuilding an /uploads/ path outranks leaving an absolute URL alone', async () => {
    const resolve = await withHost();
    expect(resolve('//other.example.com/uploads/img.png')).toBe(
      'https://cms.example.com/uploads/img.png'
    );
  });

  test('preserves the query string and fragment when rebuilding', async () => {
    const resolve = await withHost();
    expect(resolve('/uploads/img.png?width=100#top')).toBe(
      'https://cms.example.com/uploads/img.png?width=100#top'
    );
  });

  test('leaves a non-uploads absolute URL alone even with a host set', async () => {
    const resolve = await withHost();
    expect(resolve('https://cdn.example.com/logo.png')).toBe(
      'https://cdn.example.com/logo.png'
    );
  });
});

describe('resolveStrapiMedia', () => {
  test('bundles the resolved src with the visual-editing source attribute', () => {
    const props = resolveStrapiMedia('/uploads/img.png');
    expect(props.src).toBe('/uploads/img.png');
    expect(props).toHaveProperty('data-strapi-source');
  });

  test('survives a null url so callers need no separate guard', () => {
    expect(resolveStrapiMedia(null).src).toBe('');
  });
});
