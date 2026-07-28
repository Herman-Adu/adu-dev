# Media fields accept only images, and video arrives as its own field

The four media fields that currently permit video and audio uploads are narrowed
to `["images"]`. `StrapiMedia` loses its `<video>` and `<audio>` branches, and
the two `jsx-a11y/media-has-caption` suppressions go with them. #46 posed this as
a choice between adding a caption track to the model or accepting media without
captions; the evidence says neither, because the model never meant to accept
video in the first place.

## The fields, and what they are called

| Field                                  | `allowedTypes` today              |
| -------------------------------------- | --------------------------------- |
| `article.image`                        | images, files, videos, **audios** |
| `product.images`                       | images, files, videos             |
| `shared.seo.metaImage`                 | images, files, videos             |
| `shared.social-media-icon-links.image` | images, files, videos, **audios** |

Every one is named `image`, `images` or `metaImage`. These are Strapi's
permissive defaults left untightened, not a decision anyone took: an OG image
must be an image, a social icon must be an image, and an article cover that is
an audio file is not a thing anybody designed.

## Three findings that settle it

**Only one call site can reach the video branch at all.** `StrapiMedia` branches
on `mime`, and of its ten call sites exactly one passes it — `blog-layout.tsx`,
for `article.image`. The other three permissive fields feed their URL to
`next/image` with `mime` undefined, so a video uploaded to `product.images` or
`seo.metaImage` today is handed to a component that cannot render it. That is a
latent rendering bug, and it is the same root cause as the accessibility one:
fields that accept more than anything downstream was built for.

**Strapi has no caption track to point at.** `plugin::upload.file` carries
`caption`, but it is `Schema.Attribute.Text` — a string for display, not a
WebVTT asset. So `<track kind="captions" src=…>` has no source without adding a
field, exactly as #46 says. The premise holds; it is the conclusion that changes.

**Nothing in the demo content is affected.** The seed
(`apps/strapi/data/seed.tar.gz`) holds 115 assets, and every `mime` recorded
across them — for the originals and for the thumbnail, small, medium and large
variants Strapi generates — is `image/*`: png, jpeg, webp and svg. There is no
`video/*` or `audio/*` anywhere in it. Narrowing these fields breaks no existing
content and needs no migration of the template's own data.

## Why not the two options #46 offered

**Adding a caption field** solves an accessibility problem for content the model
should not be accepting, and pays for it on every upload in three fields where
video was never wanted. It is the right shape for a real video feature and the
wrong shape for tightening an accidental one.

**Accepting it** leaves two permanent lint suppressions guarding a shape nobody
chose, plus the latent `next/image` bug untouched. #30 added those suppressions
deliberately and pointed them at #46 — resolving #46 by making them permanent
would be the worst of the three outcomes.

Narrowing dissolves both. There is no caption problem because there is no
uncaptioned media, and the suppressions are deleted rather than justified.

## What a real video feature looks like

If a client project or this template later wants video, it arrives as a **named
field** — `videoVersion`, `demoVideo` — not as a widened `image`. That field
carries a companion `captions` upload restricted to `files`, and `StrapiMedia`
regains a video branch that renders `<track kind="captions">` from it. The
accessibility requirement then attaches to the feature that created it, and
`jsx-a11y/media-has-caption` stays enabled to enforce it.

This is the point of deciding it now rather than later: the template is cloned
into client projects, so its defaults become their starting accessibility
posture. "Media fields declare what they actually accept" is a better default to
inherit than "every image field also takes video, uncaptioned".

## Consequences

Editors can no longer upload video or audio into those four fields. That is the
intended effect; the upload dialogue will filter to images.

The implementation is a separate, small change and is not part of this record:
narrow the four `allowedTypes`, delete the two branches and the `mime`,
`videoProps` and `audioProps` props from `StrapiMedia`, drop the two
suppressions, and re-run the seed round trip from #52 to confirm the schema
change survives export and re-import.

One check this record cannot make: whether any **non-seed** content in a running
Strapi already holds a video in one of these fields. The template's own data is
clean, but a developer's local database may not be. Verify before narrowing, and
treat a hit as content to migrate rather than a reason to reopen the decision.
