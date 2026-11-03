/** Default REST router: /api/case-studies and /api/case-studies/:documentId. */
import { factories } from "@strapi/strapi";

export default factories.createCoreRouter("api::case-study.case-study");
