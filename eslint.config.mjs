import coreWebVitals from "eslint-config-next/core-web-vitals";

/**
 * Flat config. eslint-config-next 16 ships flat arrays directly, so no
 * FlatCompat shim is needed.
 *
 * Not yet a blocking CI gate: `forge-scene.tsx` carries 9 pre-existing
 * react-hooks/refs errors from scene 02. Fix those, then add
 * `npm run lint` to .github/workflows/ci.yml.
 */
const config = [
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts"],
  },
  ...coreWebVitals,
];

export default config;
