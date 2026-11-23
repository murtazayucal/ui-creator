---
name: page
description: Improve one page or screen: hierarchy, layout, spacing rhythm and consistency with the rest of the app.
argument-hint: "<route or page file>"
disable-model-invocation: true
---

# Page

Reply in the user's language. Target: `$ARGUMENTS`. If empty, ask which page.

Core files: `${CLAUDE_PLUGIN_ROOT}/skills/ui-core/`. Read `references/change-protocol.md` there first and follow it; this file only adds what is specific to one page.

## Steps

1. **Locate** the page file and the components it renders.
2. **Before editing:** the protocol's steps 1–6, with the page and its own components as the audit target.
3. **Identify the surface** with `references/domains.md` (marketing, app, dashboard, checkout, ...). It decides which rules weigh most.
4. **State the page's job** in one sentence: what the user comes here to do, and the one primary action. If you cannot tell from the code, ask.
5. **Look** at the rendered page at 320, 768 and 1280 px when a browser is available.
6. **Diagnose** what works against the job:
   - More than one dominant action; the primary action not the most visible thing.
   - Grouping: gaps inside groups not smaller than gaps between them.
   - The same spacing for every section; no rhythm.
   - Components that differ from the same component elsewhere in the app.
   - Missing empty, loading or error views (`references/states.md`).
   - Generic defaults, only where `references/anti-patterns.md` applies to this surface.
7. **Plan** in three lists and get agreement:
   - Page-only changes.
   - Changes that belong in a shared component or token, with the number of other places they affect.
   - Fixes that need logic.
8. **Edit** page-only changes first. Touch shared code only after a yes on that list.
9. **After the batch:** the protocol's checks. Compare before and after at the three widths.
10. **Report** in the protocol's format. Record page-specific decisions in `design-system/pages/<page>.md` and app-wide ones in `MASTER.md`.

Do not restructure a page that follows a convention users expect (sign-in, checkout, settings) to make it more distinctive.
