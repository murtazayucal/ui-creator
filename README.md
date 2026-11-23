# ui-creator

**Redesign the interface you already have, without breaking what works.**

A Claude Code plugin that puts design variations inside your running app, lets you choose with a click, and checks afterwards that your logic was left alone.

![Walkthrough: pick an element on the page, compare three variations of it, apply one](docs/images/demo.svg)

```
/plugin marketplace add murtazayucal/ui-creator
/plugin install ui-creator@ui-creator
```

Then, with your dev server running:

```
/ui-creator:explore the pricing card
```

## Why it exists

Asking an AI to "make this look better" tends to go wrong in the same few ways. Each part of this plugin answers one of them.

| What usually happens | What ui-creator does |
|---|---|
| Your brand is replaced by a generic look. | Reads the design record first and asks before replacing colors or a typeface that are already in use. |
| Handlers and state get edited during a "styling" pass. | Drafts receive the same props and handlers as the current component. After a pass, a diff check reports any logic lines that changed. |
| You pick from descriptions in a chat. | You pick from the real thing: every draft runs in your browser on your data. |
| "It's accessible now." | Contrast is computed, not guessed. A clean scan is reported as "nothing detectable found", never as compliance. |
| Drafts add charts and numbers that do not exist. | Drafts rearrange and restyle what is there. Nothing is invented. |

Two of these are measured. `claude plugin eval` runs each case with and without the plugin:

| Case | With plugin | Without |
|---|---|---|
| Asks before replacing an established brand | 1.00 | 0.33 |
| Leaves logic alone when asked to polish a component | 1.00 | 0.20 |

One run per arm so far, so read these as a first signal and not as a benchmark. Two other cases scored the same with and without the plugin; all of them are in [`evals/`](evals/README.md).

## Where to start

| You are thinking | Run |
|---|---|
| "I don't know what is wrong with it." | `/ui-creator:audit` |
| "The colors feel off for this kind of product." | `/ui-creator:palette fintech` |
| "This component looks generic." | `/ui-creator:explore <component>` |
| "Fix this one screen." | `/ui-creator:page <route>` |
| "Do the whole app, carefully." | `/ui-creator:overhaul` |

## Variations, live in your own app

Ask for alternatives to a page or a component and they appear in the browser, wired to your real data and handlers. A bar at the bottom switches between your current design and each draft.

- **Three or more drafts on one axis.** Each round varies one thing (layout, density, emphasis, a design language) and says which, so the drafts are comparable and not three unrelated redesigns.
- **Steering in your own words.** Type a note such as "more futuristic" or "like B but with badges" and press New variations; the next round follows it.
- **Compare on real rows.** A component that appears many times can show a different draft on each instance: four rows of a table, each with a different draft of the same cell.
- **One bar for everything.** With several comparisons open, a scope selector says what a click applies to: all of them together, or one component set apart ("page C, table A").
- **Checked before it is kept.** The chosen draft is viewed with long text, missing data and at phone width.

The animation above is an illustration of this flow, drawn after a real session on a small invoicing app (React, Tailwind).

## Twelve design languages

Open the Style window, pick one, mix two, or describe your own in a sentence. The drafts come back in that language using your project's own colors.

![The Style window: twelve design languages, each shown on a sample component](docs/images/styles.svg)

| Language | In short |
|---|---|
| Glassmorphism | Translucent frosted panels floating over a colorful or photographic background. |
| Neumorphism | Soft shapes pressed out of, or into, a single-color surface. |
| Claymorphism | Puffy, rounded, toy-like blocks with inner highlights. |
| Neo-brutalism | Thick black outlines, hard offset shadows, flat loud colors. |
| Minimal / flat | Mostly whitespace and type; hairlines where a line is needed, nothing decorative. |
| Material | Paper-like surfaces at clear elevation levels, filled primary actions, tonal color. |
| Bento grid | Content in rounded tiles of different sizes that lock into one grid. |
| Editorial | Looks like a well-set magazine: serif headlines, rules, generous margins. |
| Dark neon | Near-black surfaces with glowing accent lines and text. |
| Soft pastel | Light tinted surfaces, big radii, gentle colored shadows. |
| Corporate clean | Calm, dense, predictable: the look of dependable business software. |
| Terminal / mono | Monospaced type, boxes drawn with lines, the feel of a console. |

A style sets shape (surface, edge, depth, corners, type), not color. Where a style and an accessibility rule conflict, the rule wins and the style is adapted; the styles known to be hard on contrast are marked in the window.

## Everything from the browser

With the local listener running you do not need to go back to the chat:

- **Pick element:** click anything on the page to start a comparison for it. If the area holds other components, you choose on the page which of them to include.
- **Focus view:** shows one small element alone, enlarged on a dark backdrop, with its current design and every draft listed beside it. Click one to choose it.
- **Fine-tune:** typeface (the project's own fonts and fifteen system families), text size, weight, corners and padding, applied in the browser as you move them, to every instance or to one. No request is made while you play; the result is written into the code once, when you apply.
- **Narrow view:** a second copy of the page docked at the right edge. Drag its edge to scrub the width; the project's own breakpoints are one click away. It follows the bar as you switch drafts, marks what breaks at each width (content wider than the screen or spilling out of its box, cut text, tap targets under 24px) and hands that list over with one click. Click an element inside it to get variations for that width only, leaving the wide layout alone.
- **New variations:** opens a small form: a note in your own words, or a design language.
- **Save:** keeps a draft in your personal library for other projects.
- **Apply:** two clicks; the draft becomes the component and the temporary code is removed.
- **Close:** ends a comparison and keeps your current design. The dock menu can close all of them at once, or start a comparison for the whole page.
- **Settings:** the tool's own look (dark or light, four accent colors), kept in your browser.

The listener is a small server on `127.0.0.1` with a random token. Nothing leaves your machine, and while a comparison is open a local commit check keeps the temporary code out of your history.

## Commands

| Command | What it does |
|---|---|
| `/ui-creator:audit [path]` | Reports findings by severity. Changes nothing. |
| `/ui-creator:palette <domain>` | Offers palettes for a domain (English or Turkish names) with WCAG contrast results, then applies the chosen one as tokens. |
| `/ui-creator:sources` | Lists installed UI skills, the project's libraries and registries, and a catalog of shadcn registries; saves your selection. |
| `/ui-creator:element <component>` | Improves one component. |
| `/ui-creator:page <route>` | Improves one page. |
| `/ui-creator:explore <element>` | Shows alternatives for one element live in the browser and applies the one you pick. |
| `/ui-creator:library` | Saves designs you like to a personal library outside the project and reuses them in other projects. |
| `/ui-creator:overhaul` | Reworks the whole app in phases, stopping for approval. |

The `ui-core` skill loads automatically for UI work and holds the rules, data and scripts the commands share.

## Works with

| | Live comparisons | Element picker dock |
|---|---|---|
| React 16.8+ (including Next.js) | Yes | Yes |
| Vue 2.6, 2.7 and 3 | Yes | Yes |
| Svelte 3, 4 and 5 | Yes | Yes |
| Angular 12+ (NgModule or standalone) | Yes | Yes |
| Anything else with a module bundler | Static previews of each draft | Yes |

Requirements:

- Claude Code 2.1.275 or later.
- Node.js 18 or later. The scripts have no dependencies.
- Git, for the check that a styling pass did not change logic.

To try a local checkout without installing:

```
claude --plugin-dir /path/to/ui-creator
```

## Staying up to date

Claude Code can update the plugin for you, but for a marketplace added from GitHub this is off until you turn it on:

1. Run `/plugin` and open the **Marketplaces** tab.
2. Select `ui-creator` and turn auto-update on.

From then on Claude Code checks at the start of a session and tells you when a new version has been installed.

To update by hand instead, in your shell:

```
claude plugin marketplace update ui-creator
claude plugin update ui-creator@ui-creator
```

The plugin never checks for updates by itself. What changed in each version is in the [changelog](CHANGELOG.md).

## What it keeps in your project

- `design-system/MASTER.md`: the design record every command reads first, with the decisions made and the options not chosen.
- `design-system/pages/<page>.md`: page-specific exceptions.
- `design-system/sources.json`: the component sources you chose.

## Data

- 275 color palettes from ui-ux-pro-max-skill, tweakcn, daisyUI and Catppuccin, with recomputed WCAG contrast. See `skills/ui-core/data/THIRD_PARTY_NOTICES.md`.
- A snapshot of the public shadcn registry index.
- Rebuild with `node tools/fetch-sources.mjs`, `node tools/build-palettes.mjs` and `node tools/build-registries.mjs`.

## Limits

- The audit's static scan is pattern-based. A clean result means no automatically detectable issues were found, not that the UI is accessible.
- Domain-to-color suggestions are conventions with stated evidence levels, not psychological facts.
- The design languages are conventions gathered from common usage, not standards.

## Status

Early, and used in earnest on sample apps. `explore` has had the most use, on React, with its comparisons also checked in the browser on Vue 2 and 3, Svelte 3 to 5 and Angular. `palette`, `audit` and `element` have been run as plugin commands. `page`, `overhaul` and `sources` are written but have not been run end to end yet. Issues and reports are welcome.

## License

MIT, © 2026 Murtaza Mehdi Yucal. Bundled palette data keeps its original licenses.
