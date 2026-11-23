# Design tokens

Fix a problem at the highest tier that owns it. A raw value inside a component is a finding.

## Tiers

| Tier | Holds | Example |
|---|---|---|
| Primitive | Raw scales with no meaning | `--color-gray-50…950`, `--color-brand-500`, radius and shadow scales, type scale |
| Semantic | Roles; these change per mode | `--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-border`, `--color-primary`, `--color-primary-fg`, `--color-danger`, `--color-ring`, `--radius-control` |
| Component | Only where a component must differ | `--button-height`, `--card-padding` |

Components reference semantic tokens only. Dark mode and brand themes re-point semantic tokens at other primitives; component code does not change.

The three-tier split is industry convention, not a standard. Follow the project's existing names; do not rename tokens to match this file.

## Tailwind v4

- Tokens are CSS variables declared in `@theme`. Each namespace creates utilities: `--color-*`, `--spacing-*`, `--radius-*`, `--shadow-*`, `--text-*`, `--font-*`, `--breakpoint-*`, `--ease-*`.
- Use `@theme inline` when a theme variable points at another variable, otherwise it can resolve wrongly.
- Reset a namespace with `--color-*: initial`.

Pattern for mode-aware tokens:

```css
:root            { --bg: oklch(1 0 0);    --text: oklch(0.2 0.02 260); }
[data-theme=dark]{ --bg: oklch(0.2 0 0);  --text: oklch(0.95 0 0); }

@theme inline {
  --color-bg: var(--bg);
  --color-text: var(--text);
}
```

Classes such as `bg-bg` and `text-text` then switch with the theme, and `dark:` overrides in markup become mostly unnecessary. Many `dark:` color overrides in components suggest the semantic tier is missing.

shadcn/ui projects already work this way (`--background`, `--foreground`, `--primary`, `--muted`, `--border`, `--ring` in `:root` and `.dark`). Keep that structure.

## Making an app-wide change

1. **Inventory** literals: hex, rgb, hsl and oklch values; px and rem values; Tailwind arbitrary values (`p-[13px]`); raw palette classes in components (`text-gray-500`). `audit.mjs` lists these.
2. **Cluster** near-duplicates and map each cluster to one scale step.
3. **Add or extend** tokens.
4. **Replace** the literals.
5. **Check contrast** for every semantic text/surface pair in each mode with `contrast.mjs`. Once tokens exist the pairs are a short, fixed list.
6. **Record** the tokens in `design-system/MASTER.md`.

## Token-level checks

- Every text token on its paired surface: ≥ 4.5:1.
- Borders of inputs and controls, focus ring, and meaningful icons against the adjacent surface: ≥ 3:1. Decorative borders and disabled states are exempt.
- Set `color-scheme: dark` on `<html>` for dark themes.
- Keep each token to its role. The primary action color is not a general background, border or badge color.

## Interchange

The Design Tokens Community Group format (version 2025.10, stable since 2025-10-28; a community report, not a W3C standard) is the JSON format for moving tokens between tools. In a Tailwind v4 codebase the CSS variables are the source of truth; a `.tokens.json` file is not required.
