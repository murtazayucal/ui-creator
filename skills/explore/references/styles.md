# Explore: a round in a design language

Read this when a round is asked for in a design language: a `style` signal from the bar or dock, or a style named in chat such as "glassmorphism". The language replaces the axis for the round.

- Run `node "${CLAUDE_PLUGIN_ROOT}/skills/ui-core/scripts/style.mjs" --id <ids>` and read the records. With two ids it also says whether they are a common mix. A style the catalog does not have (the user's own words) is fine: describe back in one line how you read it, then draft.
- The catalog describes shape: surface, edge, depth, corners, type. Colors still come from the project's tokens. Add a token only where the style needs a value the project lacks (a translucent surface, a glow), and record it.
- Write two or three drafts that all follow the style and differ in how far they take it or in layout, not three unrelated looks.
- Give the style what its `needs` field asks for. If that reaches outside the component (glass needs something behind it; neon needs a dark surface), keep the change inside the draft where possible and say what the page would need.
- Read `risks` before writing and check them after: run `contrast.mjs` on every text and control pair, against the lightest and darkest thing a translucent surface can sit over. Where the style and a rule conflict, the rule wins; adapt the draft and tell the user what you changed and why.
- One restyled element next to untouched ones looks like a mistake. After the user picks, ask the scope question in section 5 of `SKILL.md` and record the chosen language in `design-system/MASTER.md`.
