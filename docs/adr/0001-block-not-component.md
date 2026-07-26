# Call a dynamic-zone entry a Block, not a component

Strapi calls every reusable schema fragment a "component", but so does React, and this repo contains both — leaving "add a features component" ambiguous between a Strapi schema, a React component, or both. We call an entry in a dynamic zone a **Block**, reserving "component" for React alone, so that tickets, specs, and agent instructions name exactly one artifact.

## Considered Options

Staying faithful to Strapi's own word was the alternative, and it is not free to reject: their docs, admin UI, and the `type: "component"` schema key all say component, so anyone reading Strapi documentation has to translate. We accepted that cost because the ambiguity it removes is worse — it produces wrong work rather than mild confusion. "Section" was ruled out outright: `strapi/src/components/shared/section.json` already exists and is a field group, not a dynamic-zone entry.

## Consequences

"Block" is a domain term, not a code identifier. Existing schema keys (`dynamic_zone`, `type: "dynamiczone"`, `__component`) and Strapi's directory layout stay exactly as they are — this decision governs the words we write in issues, specs, and docs, not a rename of anything in the codebase.
