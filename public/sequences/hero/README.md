# Hero frame sequence — drop target

Scene 02 reads from this folder. Export from Blender to this spec:

- `hero_0001.webp` … `hero_0120.webp` — 120 frames, 1600 × 900, WebP q78
- alpha off, ground `#0F0F0F` baked in
- whole set under 4 MB
- `poster.webp` — the END state, same dimensions

The poster is not optional. It paints immediately, owns LCP, and is what
reduced-motion visitors and narrow viewports see instead of the sequence.
