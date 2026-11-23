---
name: explore
description: Generate alternative layouts and styles for a chosen element, show them live in the browser side by side, and apply the one the user picks.
argument-hint: "<element description, e.g. the cards in the first row>"
disable-model-invocation: true
---

# Explore

Reply in the user's language. Target: `$ARGUMENTS`. This compares layout and styling alternatives, not colors; use `palette` for color.

Core files: `${CLAUDE_PLUGIN_ROOT}/skills/ui-core/`. Follow `references/change-protocol.md` there for the guard steps and the final checks.

Works with: React with hot reload (Vite, Next.js) and a browser you can drive. Without a browser, or on another framework, say so and offer the same rounds as static previews of each draft instead.

## 1. Select

1. Open the app in the browser; start the dev server if it is not running.
2. Evaluate the contents of `assets/explore/inspect.js` in the page. Read the file and pass its text to the browser's script tool; the dev server will not serve it.
3. Find the element:
   - From a description: `__uiExplore.describe({ text: "<visible text>" })` or `__uiExplore.describe("<css selector>")`.
   - By pointing: call `__uiExplore.pick()`, ask the user to click the element in the browser, then read `__uiExplore.picked`. The click is intercepted and does not reach the app.
4. The result names the component, how many instances are on the page, and how many share a parent. Find its source file with the `searchHint`.
5. Count usages of the component across the codebase.
6. Tell the user what you found: "5 cards from `ProductCard.jsx`, all in one row, used on 2 other pages."

If `react` is false (not React, or a production build), use the `repeated` field and locate the source by text or class names.

## 2. Draft

7. Read the component, `design-system/MASTER.md` and `references/states.md`.
8. Pick one axis for the round and name it:

   | Axis | Options |
   |---|---|
   | Layout | vertical, horizontal, text over media, no media |
   | Hierarchy | lead with title, number or image |
   | Density | airy, balanced, compact |
   | Container | bordered, shadowed, flat, tinted, none |
   | Action placement | bottom, corner, full width, whole card clickable |
   | Secondary info | badge, subline, icon, hidden |

9. Write up to four drafts to `<Component>.drafts.<ext>` next to the component, exporting `drafts = { A, B, C, D }`. Each draft:
   - takes the same props and renders the same data;
   - uses the same handlers, unchanged;
   - keeps every accessibility attribute the original has;
   - uses the project's tokens;
   - differs from the others in structure, not in small spacing tweaks.
   Put a one-line comment above each saying what it tries.

## 3. Show

10. Copy `assets/explore/explore-slot.jsx` into an `__explore__` folder next to the component (`.tsx` in a TypeScript project).
11. In the component file, rename the existing component to `<Name>Current` (not exported) and export a wrapper under the original name:

    ```jsx
    export function ProductCard(props) {
      return <ExploreSlot name="ProductCard" original={ProductCardCurrent} drafts={drafts} props={props} />;
    }
    ```

    Usage sites stay untouched. Keep the export style (named or default) as it was.
12. Reload. Each instance now shows a different version with a label: the first is `current`, then A, B, C, D.
13. Take a screenshot of that view. Then, for each draft worth a closer look, open the page with `?explore=A` (or B, C, D, `current`) to see every instance in that one draft, and screenshot it. The mixed view compares shapes; the single-draft view shows how a draft handles all the real content.
14. Click one action in a draft and confirm it still works.

## 4. Choose

15. Give the user the screenshots and one line per draft on what it trades off. Say which you would pick and why.
16. Ask which one, with "none, try another approach" as an option. Accept mixes: "A's layout with C's title".
    - **None:** ask what was wrong, switch to a different axis, and write new drafts. Do not repeat rejected ideas. Keep the drafts file to the current round.
    - **A mix:** write it as a new draft and show it before applying.

## 5. Stress and scope

17. View the chosen draft with a very long title, a missing image, and at a mobile width (`references/states.md`). Fix what breaks in the draft. If the breakage comes from the surrounding layout and not the component, say so; do not change the layout in this command.
18. Ask scope, showing the usage count first:
    - every usage: the draft replaces the component;
    - only some: add a variant prop and set it at the chosen usage sites. That edits those sites; list them first.

## 6. Apply and clean up

19. Move the chosen draft's markup into the component under its original name.
20. Delete the drafts file and the `__explore__` folder, and remove the wrapper and its imports.
21. Run `node "${CLAUDE_PLUGIN_ROOT}/skills/ui-core/scripts/explore-check.mjs" --project <project>`. It must report `clean: true`.
22. Reload the page and check the browser console for errors.
23. Run the change protocol's after-batch checks (`check-diff.mjs`, `audit.mjs`, lint).
24. Record in `design-system/MASTER.md`: the choice, the axis, and what was rejected, so similar components follow it.

If the user stops partway, do steps 20–22 before anything else. Never leave drafts or the wrapper in the project.
