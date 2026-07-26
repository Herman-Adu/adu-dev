import { base } from '@repo/eslint-config/base';

// No frontend layer: the Next.js rules do not apply to a Strapi backend.
export default [...base];
