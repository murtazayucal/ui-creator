---
name: ui-core
description: Improve the look and usability of an existing user interface without breaking it. Use when the user asks to fix, polish, restyle, modernize or review a UI, page, screen or component; to choose or check colors, palettes, contrast, spacing, typography or layout; or says the interface looks generic, inconsistent or "AI-made". Covers UX rules, domain-based color selection, design tokens and a preserve-first improvement workflow.
license: MIT
---

# UI core

You are improving an interface that already exists. The user's time goes into describing what they want; reduce that by showing options and asking them to pick, not by asking them to describe.

Reply in the user's language.

## Principles

1. **Preserve first.** Read the project's current design system before proposing anything: dependencies, component config, CSS variables, existing components. Keep its styling approach and component library. Never introduce a second one unless the user chose it.
2. **Show, then ask.** Offer 2–4 concrete options the user can see. Avoid open questions such as "what style do you want?".
3. **Tokens before components, components before pages.** A change that should apply everywhere goes into a token or a shared component, not into each page.
4. **No logic changes.** Touch markup, classes and styles. Leave data fetching, state and handlers alone. If a fix needs a logic change, say so and ask.
5. **Check, don't assume.** Contrast is computed, not eyeballed. After a visual change, look at the rendered result at a desktop and a mobile width.
6. **Scope is explicit.** Every change is one of: this element, this page, the whole app. Confirm which before editing.

## Design record

Decisions live in `design-system/MASTER.md` in the user's project, with page exceptions in `design-system/pages/<page>.md`. Read it at the start if it exists; update it when the user accepts a direction. This file is what keeps pages consistent across sessions.

## Reference files

Read only the one the task needs. Paths are relative to this skill's folder.

| File | Read when |
|---|---|
| `references/ux-rules.md` | Auditing or judging usability; numeric thresholds |
| `references/states.md` | Building or reviewing an interactive element or a data view |
| `references/anti-patterns.md` | The result looks generic; before finalizing a new visual direction; before showing drafts or new interface text |
| `references/tokens.md` | Adding or restructuring colors, spacing, type or radius tokens |
| `references/domains.md` | Choosing a visual direction for a product category |
| `references/change-protocol.md` | Before editing any existing UI: the guard, check and report steps |
| `references/verification.md` | Checking a change in a browser: what to capture, measure and hand to a separate reviewer |

Create the design record from `assets/MASTER.template.md`.

Each rule in these files is marked as a standard, a guideline or a convention. Treat conventions as suggestions.

## Scripts

Zero-dependency Node scripts in `scripts/`, run as `node "<skill folder>/scripts/<name>.mjs"`. Do not chain commands with `&&` or `||`; Windows PowerShell 5.1 rejects them.

| Script | Purpose | Status |
|---|---|---|
| `palette.mjs --domain <d>` | Query 275 contrast-checked palettes by domain, mode, hue or chroma; `--id` for one in full | ready |
| `style.mjs [--id <a,b>]` | Catalog of 12 design languages (glassmorphism, neo-brutalism, bento...): shape rules, needs, risks and known mixes | ready |
| `contrast.mjs <fg> <bg> [...]` | WCAG 2.2 contrast for color pairs (hex, oklch, hsl, rgb) | ready |
| `detect-stack.mjs [project]` | Report framework, styling approach, component library and token files | ready |
| `dev-server.mjs --project <p>` | Find this project's dev server among what is running on this machine, and the address to open | ready |
| `audit.mjs [path]` | Static scan for accessibility, state, consistency and copy issues, sorted by severity | ready |
| `check-diff.mjs --project <p>` | Classify uncommitted changes as style-only, markup, logic or non-UI, to show a styling pass left logic alone | ready |
| `verify-compare.mjs <before> <after>` | Compare two rendered-page measurements and list what got worse | ready |
| `explore-listen.mjs wait --config <file>` | Background listener: reports a click on the explore bar or dock by exiting with one JSON line; picks its own port and survives between waits | ready |
| `explore-guard.mjs install\|remove --project <p>` | Keeps temporary explore code out of commits while a comparison or design mode is open | ready |
| `library.mjs <save|list|show|remove>` | The user's personal library of saved designs, shared across projects (`~/.ui-creator/library`) | ready |
| `explore-check.mjs --project <p>` | Confirm an explore session left no drafts or helper code behind | ready |
| `sources.mjs --project <p>` | List installed UI skills, the project's libraries and registries, and a catalog of shadcn registries | ready |

If `design-system/sources.json` exists in the project, use only the sources it lists.

Never judge contrast by eye; run `contrast.mjs`. Text needs 4.5:1, large text and non-text UI 3:1.

## Commands

The plugin's user-invoked commands build on this skill: `sources`, `palette`, `audit`, `element`, `page`, `explore`, `overhaul`, `library`.
