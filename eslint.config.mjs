import { base } from '@repo/eslint-config/base';
import { nextLayer } from '@repo/eslint-config/next';

/**
 * One config for the whole repository.
 *
 * A single root config rather than one per workspace, so that tools which run
 * from the repository root — the pre-commit hook in particular — resolve rules
 * the same way the app scripts do. Each app's `lint` script points here with
 * `-c`, so there is exactly one place a rule is decided.
 */
export default [...base, ...nextLayer(['apps/next/**/*.{js,jsx,ts,tsx}'])];
