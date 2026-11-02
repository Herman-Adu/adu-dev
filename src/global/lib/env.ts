import { z } from "zod";

/**
 * Server-side environment. Parsed once, at module load, so a missing or
 * malformed value fails the build rather than a request at 3am.
 */
const ServerEnv = z.object({
  CONTENT_SOURCE: z.enum(["local", "strapi"]).default("local"),
  STRAPI_URL: z.string().url().optional(),
  STRAPI_API_TOKEN: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("https://adudev.co.uk"),
});

export type ServerEnv = z.infer<typeof ServerEnv>;

export const env: ServerEnv = ServerEnv.parse({
  CONTENT_SOURCE: process.env.CONTENT_SOURCE,
  STRAPI_URL: process.env.STRAPI_URL,
  STRAPI_API_TOKEN: process.env.STRAPI_API_TOKEN,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});
