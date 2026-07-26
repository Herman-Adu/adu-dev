### What does it do?

Describe the technical changes you did.

### Why is it needed?

Describe the issue you are solving.

### How to test it?

Simply make sure the whole Strapi application doesn't crash and the connected Next.js application is fully working.

Some additional things to check:

- [ ] Strapi project uuid is "LAUNCHPAD". `apps/strapi/package.json`.
- [ ] Strapi version is the latest possible.
- [ ] If the Strapi version has been changed, make sure that the `apps/strapi/scripts/prefillLoginFields.js` works.
- [ ] If you updated content, make sure to create a new export in the `apps/strapi/data` folder and update the `apps/strapi/package.json` seed command if necessary.

### Related issue(s)/PR(s)

Let us know if this is related to any issue/pull request.
