---
name: palette
description: Suggest contrast-checked color palettes for an application domain and apply the chosen one as tokens.
argument-hint: "<domain, e.g. fintech, health, e-commerce>"
disable-model-invocation: true
---

# Palette

Reply in the user's language. Domain: `$ARGUMENTS`. If empty, infer it from the project and confirm.

The library holds 275 palettes from four open-source projects, each with precomputed WCAG contrast. Use the script; do not present palettes from memory as part of the library.

## Script

```
node "${CLAUDE_PLUGIN_ROOT}/skills/ui-core/scripts/palette.mjs" --domain <domain> [--mode light|dark] [--hue <hue>] [--chroma neutral|muted|moderate|vivid] [--source <source>] [--limit 5]
```

- `--domains` lists known domains; English and Turkish aliases work. If the user's domain is not listed, pass the nearest listed one or use `--search <english word>`.
- `--id <id>` returns one palette in full: every role in hex and OKLCH, every contrast check, source and license.
- `--include-failing` also returns modes that fail a text-contrast pair. Without it, only clean modes are returned.
- Output is JSON. Hues: red, orange, yellow, green, teal, cyan, blue, indigo, purple, pink, neutral.

## Steps

1. **Read the current colors.** Find the project's color tokens. Ask which are brand colors that must stay.
2. **Query** by domain. If the top results share one hue, run again with `--hue` set to other hues from the domain's direction so the options differ.
3. **Show 3–4 candidates** that differ in direction. For each: name, the main role colors, the lowest text contrast, and any `uiWarnings`. State the domain's evidence level once (A, B or C) and its caution if present.
4. **Preview on request.** Write a single HTML file that renders each candidate on real UI samples (page, card, primary and secondary buttons, input, destructive button, muted text) and open it in the browser.
5. **Ask** which one, with "none of these" as an option. On "none", ask what was wrong and query again with different `--hue`, `--chroma` or `--mode`.
6. **Apply as tokens.** Fetch the full record with `--id`. Map its roles onto the project's existing token names. Do not rename tokens or change the styling approach. If the palette has only one mode and the project needs both, say so and derive the other with the user's agreement.
7. **Verify** the final pairs in the project with `contrast.mjs`, including any brand color that was kept. Text needs 4.5:1; large text and non-text UI need 3:1.
8. **Record** the choice, its palette id and source in `design-system/MASTER.md`.

## Reading the results

- `roleModel` tells you what `accent` means: in `shadcn` palettes it is a subtle hover surface, in `daisyui` palettes a brand accent, in `mapped` palettes this project's own assignment.
- Domain matches are conventions. Do not present them as psychological facts, and do not make claims about what a color means in a specific culture.
- Status colors are locale-dependent in finance: some East Asian markets use red for gains.
- Keep attribution: when a palette is applied, note its source and license in the design record.
