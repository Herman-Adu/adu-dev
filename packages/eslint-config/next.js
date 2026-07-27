import nextPlugin from '@next/eslint-plugin-next';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';

/**
 * The frontend layer: the rules that only make sense for a React and Next.js
 * application. It does **not** include the base — the root `eslint.config.mjs`
 * composes the two, so that one config can cover a repository where only some
 * workspaces are React.
 *
 * This uses `@next/eslint-plugin-next` directly rather than
 * `eslint-config-next`. Next 16 removed the `next lint` subcommand, and the
 * wrapper config was the piece that would not load under this app's linter —
 * the plugin underneath it carries the actual rules and composes cleanly into
 * flat config.
 *
 * @param {string[]} files - glob patterns the layer applies to.
 */
export const nextLayer = (files) => [
  {
    files,
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      '@next/next': nextPlugin,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      'unused-imports': unusedImports,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      ...reactHooks.configs.recommended.rules,

      // Adopted in #30 after measuring what the code already satisfied:
      // jsx-a11y recommended reported **2** violations across the whole
      // frontend, both `media-has-caption` on the Strapi media renderer, and
      // unused-imports reported **0**. Both are errors from the start because
      // there was nothing to migrate.
      ...jsxA11y.flatConfigs.recommended.rules,
      'unused-imports/no-unused-imports': 'error',

      // Promoted from warning in #30. An effect whose dependency array lies is
      // how this repo's testimonials slider ended up recreating its interval on
      // every tick — see #41 and the prototype recorded there. Six violations
      // were hidden behind three suppressions, one of them file-wide; all are
      // now either fixed or disabled in place with the hazard named.
      'react-hooks/exhaustive-deps': 'error',

      // This app is App Router only — it has no `pages/` directory and never
      // will. The rule exists to catch <a> tags pointing at pages-router
      // routes, so it has nothing to check here; left on, it instead searches
      // for `pages/` relative to the working directory and errors when it
      // cannot find one, which breaks every run started from the repo root.
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
];

export default nextLayer;
