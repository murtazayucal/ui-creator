# ui-creator

A Claude Code plugin for improving the interface of an application that already exists. It audits the UI against UX and accessibility rules, suggests contrast-checked color palettes for the product's domain, lists the component sources you can use, and applies changes token-first while checking that application logic was left alone.

Status: early development, unpublished. All seven commands are written. `palette`, `audit` and `element` have been run as plugin commands; `explore` and the browser verification flow have been walked through by hand on a sample app; `page`, `overhaul` and `sources` have not been run as plugin commands yet.

## Commands

| Command | What it does |
|---|---|
| `/ui-creator:audit [path]` | Reports findings by severity. Changes nothing. |
| `/ui-creator:palette <domain>` | Offers palettes for a domain (English or Turkish names) with WCAG contrast results, then applies the chosen one as tokens. |
| `/ui-creator:sources` | Lists installed UI skills, the project's libraries and registries, and a catalog of shadcn registries; saves your selection. |
| `/ui-creator:element <component>` | Improves one component. |
| `/ui-creator:page <route>` | Improves one page. |
| `/ui-creator:library` | Saves designs you like to a personal library outside the project and reuses them in other projects. |
| `/ui-creator:overhaul` | Reworks the whole app in phases, stopping for approval. |
| `/ui-creator:explore <element>` | Shows layout alternatives for one element live in the browser, side by side, and applies the one you pick. A bar in the page switches drafts, opens a phone view, and (with a local listener) removes, requests, saves and applies drafts without typing in chat. Picking an area that holds other components asks, on the page itself, which of them to include. A Style window previews twelve design languages (glassmorphism, neo-brutalism, bento and others); pick one, mix two, or describe your own, and the drafts come back in that language using your project's colors. Comparisons work on React 16.8+ (including Next.js), Angular 12+ (NgModule or standalone), Vue 2.6+ and Svelte 3+; the element picker dock works on any framework with a module bundler. While a comparison is open, a local commit check keeps the temporary code out of your history. |

The `ui-core` skill loads automatically for UI work and holds the rules, data and scripts the commands share.

## Requirements

- Node.js 18 or later. The scripts have no dependencies.
- Git, for the check that a styling pass did not change logic.

## Install

In Claude Code 2.1.275 or later:

```
/plugin install ui-creator --marketplace murtazayucal/ui-creator
```

To try a local checkout without installing:

```
claude --plugin-dir /path/to/ui-creator
```

## Evals

`evals/` holds cases for `claude plugin eval`, which runs each case with and without the plugin. See `evals/README.md` for the cases, the last results and the limits.

## What it keeps in your project

- `design-system/MASTER.md`: the design record every command reads first.
- `design-system/pages/<page>.md`: page-specific exceptions.
- `design-system/sources.json`: the component sources you chose.

## Data

- 275 color palettes from ui-ux-pro-max-skill, tweakcn, daisyUI and Catppuccin, with recomputed WCAG contrast. See `skills/ui-core/data/THIRD_PARTY_NOTICES.md`.
- A snapshot of the public shadcn registry index.
- Rebuild with `node tools/fetch-sources.mjs`, `node tools/build-palettes.mjs` and `node tools/build-registries.mjs`.

## Limits

- The audit's static scan is pattern-based. A clean result means no automatically detectable issues were found, not that the UI is accessible.
- Domain-to-color suggestions are conventions with stated evidence levels, not psychological facts.

## License

MIT. Bundled palette data keeps its original licenses.
