# adu-dev

![adu-dev](./LaunchPad.jpg)

A Strapi + Next.js monorepo template. It began life as Strapi's [LaunchPad](https://github.com/strapi/LaunchPad) demo and no longer tracks it.

This repository contains:

- A Strapi 5 project with content-types and seeded demo data
- A Next.js 16 client that renders that content, localized in English and French
- Shared tooling at the root, with both apps as pnpm workspaces resolved by a single lockfile

## 🌌 Get started

Strap yourself in! Get started on your local machine by following the instructions below.

### Prerequisites

- **Node.js** v18 or higher
- **pnpm** as your package manager (this project uses pnpm internally for its scripts)

> **Don't have pnpm installed?** You can enable it via Node.js Corepack, which
> reads the `packageManager` field and gives you the exact version this repo
> expects:
>
> ```sh
> corepack enable
> ```
>
> Or install it globally:
>
> ```sh
> npm install -g pnpm
> ```

## 1. Clone

To infinity and beyond! Clone the repo:

```sh
git clone https://github.com/Herman-Adu/adu-dev.git
cd adu-dev
```

## 2. Setup

One command installs every workspace — both apps and the shared toolchain — and copies the environment files:

```sh
pnpm setup
```

## 3. Seed the Data

Populate your Strapi instance with demo content:

```sh
pnpm seed
```

## 4. Start the Development Servers

Launch both Strapi and Next.js concurrently from the root:

```sh
pnpm dev
```

This starts the Strapi server first, waits for it to be ready, then starts the Next.js frontend. You're now a spacefaring content master!

Visit http://localhost:1337/admin to create your first Strapi user, and http://localhost:3000 to discover your space rocket website.

## Features Overview ✨

### User

<br />

- **An intuitive, minimal editor** The editor allows you to pull in dynamic blocks of content. It’s 100% open-source, and it’s fully extensible.<br />
- **Media Library** Upload images, video or any files and crop and optimize their sizes, without quality loss.<br />
- **Flexible content management** Build any type of category, section, format or flow to adapt to your needs. <br />
- **Sort and Filter** Built-in sorting and filtering: you can manage thousands of entries without effort.<br />
- **User-friendly interface** The most user-friendly open-source interface on the market.<br />
- **SEO optimized** Easily manage your SEO metadata with a repeatable field and use our Media Library to add captions, notes, and custom filenames to optimize the SEO of media assets.<br /><br />

### Global

<br />

- [Customizable API](https://strapi.io/features/customizable-api): Automatically build out the schema, models, controllers for your API from the editor. Get REST or GraphQL API out of the box without writing a single line of code.<br />
- [Media Library](https://strapi.io/features/media-library): The media library allows you to store your images, videos and files in your Strapi admin panel with many ways to visualize and manage them.<br />
- [Role-Based Access Control (RBAC)](https://strapi.io/features/custom-roles-and-permissions): Role-Based Access Control is a feature available in the Administration Panel settings that let your team members have access rights only to the information they need.<br />
- [Internationalization (i18n)](https://strapi.io/features/internationalization): Internationalization (i18n) lets you create many content versions, also called locales, in different languages and for different countries.<br />
- [Audit Logs](https://strapi.io/blog/reasons-and-best-practices-for-using-audit-logs-in-your-application): The Audit Logs section provides a searchable and filterable display of all activities performed by users of the Strapi application<br />
- [Data transfer](https://strapi.io/blog/importing-exporting-and-transferring-data-with-the-strapi-cli): Streams your data from one Strapi instance to another Strapi instance.<br />
- [Review Worfklows](https://docs.strapi.io/user-docs/settings/review-workflows): Create and manage any desired review stages for your content, enabling your team to collaborate in the content creation flow from draft to publication. <br />

## Resources

[Docs](https://docs.strapi.io) • [Discord](https://discord.strapi.io) • [YouTube](https://www.youtube.com/c/Strapi/featured) • [Strapi Design System](https://design-system.strapi.io/) • [Marketplace](https://market.strapi.io/) • [Cloud Free Trial](https://cloud.strapi.io)

## Customization

- The Strapi application contains a custom population middlewares in every api route.

- The Strapi application contains a postinstall script that will regenerate an uuid for the project in order to get some anonymous usage information concerning this demo. You can disable it by removing the uuid inside the `./apps/strapi/package.json` file.

- The Strapi application contains a script that prefills the login fields, at `apps/strapi/scripts/prefillLoginFields.js`. It exists for the hosted LaunchPad demos, where a Super Admin is created automatically, and has no effect on a local install.
