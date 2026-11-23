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

**Copy** (text you write; never a reason to rewrite text that is already there)
- Text that would fit any company ("Unlock the power of...", "seamless", "elevate"; in Turkish "sorunsuz bir deneyim", "gücünü keşfedin", "bir üst seviyeye taşıyın").
- Invented statistics and testimonials. Never add these.
- A greeting or cheer that carries no information ("Welcome back! 🎉", "Harika!"), and exclamation marks on routine messages.
- Three adjectives or three parallel items by reflex ("fast, secure and reliable").
- A button that does not say what happens ("Get started", "Learn more", "Hemen başla", "Devam") where a verb and its object fit ("Create invoice", "Fatura oluştur").
- An empty state that only announces emptiness ("No data yet"). Say what will appear here and how to add the first one.
- Title Case On Every Label in a product that writes in sentence case; a placeholder doing a label's job.
- In longer text: em dashes between clauses, "not just X but Y", a closing line that restates the paragraph.

Better: the product's own nouns, a concrete verb, a real number from the data, and the length a busy person would put up with. Match the language and the form of address the product already uses.

## Tests

- **Card test:** remove the border, shadow, background and radius. If nothing is harder to understand or use, it was not a card.
- **Identity test:** could the first screen belong to any other company? If so, add something specific to this one.
- **Stripe test:** say in one word what the stripe's color means. If you cannot, remove it.
- **Copy test:** if deleting 30% of the text improves the page, keep deleting.
- **Swap test:** put a competitor's name above the text. If it still reads true, it says nothing about this product.
- **Button test:** say the label after "I want to". If the sentence makes no sense, rename the button.

## In drafts

Run this before showing drafts in `explore`, and before proposing a new look in `element`, `page` or `overhaul`. It takes a minute and is the difference between three alternatives and the same default in three coats.

1. Check each draft against the tells above, for the kind of surface it is (see the table below).
2. **What the user asked for is not a smell.** A design language they chose (glass is translucent cards over a gradient by definition), a note in their words, or something the project already does stays.
3. A tell that remains has to earn its place: say in the draft's one-line comment what it does for the reader (the stripe's color is the metric's status; the capitals mark the one section title). If you cannot say it, redraw that part.
4. Look across the round. If two drafts differ only in decoration (a border here, a shadow there), replace one with a different structure.
5. **Do not rewrite existing text in a draft.** The copy tells apply only to text the draft needs that did not exist before (an empty state, a new label), and when the user asks for wording. Show such text to the user as new, in their language.
6. Tell the user in one line what you caught and changed ("B had capitals on every card label; kept on the section title only"). Say nothing when nothing was caught.

## Where to apply

| Surface | Apply |
|---|---|
| Marketing and landing pages | All of the above |
| Apps, SaaS, dashboards | Only emoji icons, purposeless cards and decorative gradients. Neutral or system fonts are fine here |
| Transactional flows (sign-in, checkout, settings) | None. Convention wins |
