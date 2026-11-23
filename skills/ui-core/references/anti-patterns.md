# Generic-looking defaults

List version: 2026-11. This list ages. What reads as generic shifts every few months; update it and bump the version.

These are smells, not errors. The evidence is practitioner and vendor opinion, not a standard. Report them at severity 1 unless they hurt usability.

## The rule that outranks this file

**An established design is not a smell.** If the project already has a brand that uses Inter or purple, keep it. Apply this file only where the project has no committed direction, or where the user asked for a more distinctive look.

Banning a default does not help by itself: the model moves to the next most common choice (Inter → Space Grotesk; purple gradient → cream and terracotta). The fix is a choice tied to this product, recorded as tokens.

## Tells

**Color**
- Default indigo or violet as the brand color (`#6366f1`, `#8b5cf6`, `#7c3aed`), with no brand reason.
- Purple-to-blue gradient (`#667eea` → `#764ba2`, `from-purple-* to-blue-*`) on hero, buttons or headings.
- Gradient text on headings (`bg-clip-text text-transparent`).
- Color spread evenly. Better: one dominant color and one sharp accent.
- An accent color reused for backgrounds, borders and badges until it means nothing.
- Second-generation default: warm cream background, serif headings, terracotta or olive accent.
- Near-black background with acid green accent.

**Typography**
- Only Inter, Roboto, Arial, Open Sans, Lato or the system stack, with no display face and no reason.
- The same weight and size relationships everywhere; hierarchy by size alone.
- All-caps small labels above every heading.

**Layout**
- Everything centered.
- Hero: centered heading, subtitle, two buttons, three feature cards.
- Identical card grids for every section; three-column pricing by default.
- The same vertical spacing for every section.

**Components**
- Cards everywhere, including around non-interactive content; cards inside cards.
- A colored left stripe on rounded cards as decoration.
- Translucent blurred cards over a gradient.
- One radius and one shadow for everything, or many unrelated values.

**Icons and media**
- Emoji used as icons.
- Abstract blobs, generic 3D illustrations, fake screenshots built from CSS shapes.

**Copy**
- Text that would fit any company ("Unlock the power of...", "seamless", "elevate").
- Invented statistics and testimonials. Never add these.

## Tests

- **Card test:** remove the border, shadow, background and radius. If nothing is harder to understand or use, it was not a card.
- **Identity test:** could the first screen belong to any other company? If so, add something specific to this one.
- **Stripe test:** say in one word what the stripe's color means. If you cannot, remove it.
- **Copy test:** if deleting 30% of the text improves the page, keep deleting.

## Where to apply

| Surface | Apply |
|---|---|
| Marketing and landing pages | All of the above |
| Apps, SaaS, dashboards | Only emoji icons, purposeless cards and decorative gradients. Neutral or system fonts are fine here |
| Transactional flows (sign-in, checkout, settings) | None. Convention wins |
