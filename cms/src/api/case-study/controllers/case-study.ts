/**
 * case-study controller — the default factory, unmodified.
 *
 * Shaping happens on the front end at the contract boundary, not here. A
 * hand-rolled controller would put mapping logic in two places.
 */
import { factories } from "@strapi/strapi";

export default factories.createCoreController("api::case-study.case-study");
