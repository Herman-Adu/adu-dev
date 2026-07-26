/**
 * The frontend's view of the backend's content model.
 *
 * `generated/` is a mirror of `apps/strapi/types/generated/`, refreshed by
 * `pnpm sync:types` and checked by `pnpm check:types-drift`. Strapi generates
 * those files in place because redirecting its output can break types the
 * platform itself depends on, so this package copies rather than moves them.
 *
 * The generated files describe *schemas*, not data. `Schema.Attribute.String`
 * is a description of a field, not a `string`. Turning a schema into the shape
 * an API response actually has is what `Data.Component` and `Data.ContentType`
 * do, which is why they are re-exported here — consumers need them to get any
 * use out of the generated definitions.
 */
import type { Data, UID } from '@strapi/strapi';

export type { Data, Schema, Struct, UID } from '@strapi/strapi';

export * from '../generated/components';
export * from '../generated/contentTypes';

/**
 * The data shape of a Fieldset — a reusable group of fields, addressed by its
 * Strapi component UID. See CONTEXT.md for why these are Fieldsets and not
 * "components".
 *
 * @example
 * type Button = Fieldset<'shared.button'>;
 */
export type Fieldset<TUid extends UID.Component> = Data.Component<TUid>;

/**
 * The data shape of a Block — one authored entry in a page's dynamic zone.
 * Blocks are Strapi components too, so this is `Fieldset` under a name that
 * matches how the domain talks about them.
 *
 * @example
 * type Hero = Block<'dynamic-zone.hero'>;
 */
export type Block<TUid extends UID.Component> = Data.Component<TUid>;

/**
 * The data shape of a content type — a Page, Product, Article and so on.
 *
 * @example
 * type Page = Entry<'api::page.page'>;
 */
export type Entry<TUid extends UID.ContentType> = Data.ContentType<TUid>;
