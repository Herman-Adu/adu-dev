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

**Page**:
An editor-created page, addressed by a slug and composed of Blocks.
_Avoid_: route, screen

**Listing page**:
One of the two fixed pages that list published content — the blog listing and the product listing. Editors configure them but cannot create more.
_Avoid_: index page, landing page, single type

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
