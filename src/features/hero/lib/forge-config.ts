/**
 * Scene 02 — "The forge".
 *
 * Shards converge out of the dark onto a faceted core, inside the orbit
 * ellipse taken from the Adu Dev mark. Entirely scroll-driven: the scene
 * has no idle animation, so the canvas renders on demand and costs
 * nothing when the page is still.
 */

export const FORGE = {
  /** Instanced neutral shards. One draw call. */
  shardCount: 72,
  /** Accent shards, brand orange. Kept tiny — orange stays under 5% of frame. */
  accentCount: 8,
  /** Radius of the assembled shell. */
  shellRadius: 1.18,
  /** Where shards start, before assembly. */
  scatterMin: 6,
  scatterMax: 15,
  orbitRadius: 1.78,
  /** Camera dolly across the scrub. */
  cameraZ: [8.6, 6.6] as const,
  /** Push the form right so the copy column on the left stays clear. */
  offsetX: 1.6,
  /** Fog pulls distant shards back into the ground colour. */
  fogNear: 7,
  fogFar: 22,
} as const;

export const COLOR = {
  ground: "#0F0F0F",
  surface: "#242424",
  border: "#2D2D2D",
  ink3: "#8A8A8A",
  brand: "#F47C00",
} as const;

/** Deterministic PRNG — the layout must be identical on every load. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Shard {
  /** Direction on the assembled shell (unit vector). */
  dir: [number, number, number];
  /** Distance out at progress 0. */
  scatter: number;
  /** Lateral offset while travelling, so paths curve instead of spoking. */
  drift: [number, number, number];
  rotation: [number, number, number];
  spin: number;
  scale: number;
  /** Stagger window — this shard lands between t0 and t1. */
  t0: number;
  t1: number;
}

/**
 * Fibonacci sphere for the landed positions: even coverage with no poles,
 * which is what stops the assembled form looking like a globe.
 */
export function buildShards(count: number, seed: number): Shard[] {
  const rand = mulberry32(seed);
  const golden = Math.PI * (3 - Math.sqrt(5));
  const shards: Shard[] = [];

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / Math.max(count - 1, 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;

    const t0 = (i / count) * 0.45 + rand() * 0.1;

    shards.push({
      dir: [Math.cos(theta) * r, y, Math.sin(theta) * r],
      scatter:
        FORGE.scatterMin + rand() * (FORGE.scatterMax - FORGE.scatterMin),
      drift: [(rand() - 0.5) * 5, (rand() - 0.5) * 5, (rand() - 0.5) * 5],
      rotation: [rand() * Math.PI * 2, rand() * Math.PI * 2, rand() * Math.PI * 2],
      spin: (rand() - 0.5) * 7,
      scale: 0.62 + rand() * 0.75,
      t0,
      t1: Math.min(1, t0 + 0.4 + rand() * 0.2),
    });
  }

  return shards;
}

/** Normalised progress of one shard through its own stagger window. */
export function shardProgress(shard: Shard, t: number): number {
  const span = shard.t1 - shard.t0;
  if (span <= 0) return t >= shard.t1 ? 1 : 0;
  return clamp01((t - shard.t0) / span);
}

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Expo-out. Shards decelerate hard into place rather than drifting in. */
export function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
