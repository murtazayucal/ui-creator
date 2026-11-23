---
name: element
description: Improve a single UI component: states, spacing, contrast, accessibility and visual quality.
argument-hint: "<file or component name>"
disable-model-invocation: true
---

# Element

Reply in the user's language. Target: `$ARGUMENTS`. If empty, ask which component.

Core files: `${CLAUDE_PLUGIN_ROOT}/skills/ui-core/`. Read `references/change-protocol.md` there first and follow it; this file only adds what is specific to one component.

## Steps

1. **Locate** the component file. If the argument names a component, search for its definition; if several match, ask.
2. **Before editing:** the protocol's steps 1–6, with the component file as the audit target.
3. **Count usages** of the component. If it is used in more than one place, say how many before proposing anything.
4. **Diagnose**, reading the file against:
   - `references/states.md`: which interactive states are missing.
   - `references/ux-rules.md`: target size, text size, contrast pairs, focus ring.
   - `references/tokens.md`: raw values that should be tokens.
   - The audit findings for this file.
5. **Propose** as two short lists:
   - Styling fixes you will make now.
   - Fixes that need logic, each with what it would change. These wait for a yes.
   If the user wants to compare different looks instead of fixing problems, hand over to `explore`.
6. **Edit** on agreement.
7. **After the batch:** the protocol's checks.
8. **Stress the result** with the content list at the end of `references/states.md`: long title, missing image, at 320px wide.
9. **Report** in the protocol's format. Record any decision that should apply to similar components in `design-system/MASTER.md`.
