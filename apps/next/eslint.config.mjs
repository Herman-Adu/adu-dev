import { base } from '@repo/eslint-config/base';
import { nextLayer } from '@repo/eslint-config/next';

// Run with this app as the working directory, so the frontend layer applies to
// everything here. The root config scopes the same layer by path instead; both
// compose the identical exports, so a rule cannot mean two different things.
export default [...base, ...nextLayer(['**/*.{js,jsx,ts,tsx}'])];
