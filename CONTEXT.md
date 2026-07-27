# LaunchPad

A marketing site for a fictional content-delivery product. Editors compose pages from Blocks in Strapi; the frontend renders them in English and French.

## Language

### Composition

**Block**:
One authored part of a page — a hero, a pricing table, a call to action. Editors choose which Blocks a page has, order them, and fill them in.
_Avoid_: component, section, module, widget

**Dynamic zone**:
The ordered list of Blocks that makes up a page's body.
_Avoid_: block list, zone, page builder

**Fieldset**:
A reusable group of fields shared across content types — an SEO panel, a button, a link. Unlike a Block, a Fieldset is never chosen or ordered by an editor; it is part of whatever it sits on.
_Avoid_: component, field group, shared component

**Page**:
An editor-created page, addressed by a slug and composed of Blocks.
_Avoid_: route, screen, collection type

**Listing page**:
One of the two fixed pages that list published content — the blog listing and the product listing. Editors configure them but cannot create more.
_Avoid_: index page, landing page, single type

### Editorial

**Article**:
A dated piece of writing published on the blog, with its own page and slug.
_Avoid_: post, blog post, story

**Category**:
A named grouping that Articles belong to — an Article carries as many as apply. Categories group Articles and nothing else; Products are organised by Featured.
_Avoid_: tag, topic, subject, taxonomy

### Catalog

**Product**:
Something the site offers for sale, with its own page, images, and Blocks.
_Avoid_: item, SKU, offering

**Plan**:
One pricing tier of a Product, such as Starter or Pro. Plans present a visitor's choices; they always belong to exactly one Product.
_Avoid_: tier, package, subscription

**Featured**:
Marks a Product or Plan as promoted for emphasis — Featured Products get their own section on the product listing, a Featured Plan is badged on the pricing table.
_Avoid_: highlighted, popular, promoted

### Social proof

**Brand**:
A company displayed for credibility, shown by its logo in a Brands Block.
_Avoid_: logo, client, partner

**Testimonial**:
A quote from a named person, shown as social proof. The person quoted is part of the Testimonial — they are never an Account.
_Avoid_: review, endorsement, user

### Visitors

**Account**:
A registered visitor of the site, held by Users & Permissions.
_Avoid_: user, member, customer
