---
name: library
description: Save a design the user likes to their personal library, or list, show, reuse and remove saved designs across projects.
argument-hint: "[save <component> | list | use <name> | remove <name>]"
disable-model-invocation: true
---

# Library

Reply in the user's language. Request: `$ARGUMENTS`. With no argument, list what is saved.

The library lives outside any project, in `~/.ui-creator/library`, so a design saved in one project can be reused in another. Script:

```
node "${CLAUDE_PLUGIN_ROOT}/skills/ui-core/scripts/library.mjs" <save|list|show|remove|where> ...
```

An entry is a **recipe plus reference code**, not a drop-in component. Projects differ in tokens, data fields and component libraries; the recipe is what carries over.

## Save

1. Identify what to save: a component in the project, or a draft from an open explore comparison.
2. Write the reference code to a temporary file: the one component, self-contained, with its small display helpers. Leave out project data and anything unrelated.
3. Write the recipe: three to six sentences a designer could rebuild it from. Structure, hierarchy, what aligns with what, spacing rhythm, surface and color roles, states. Name roles ("primary color", "muted text on the dark surface"), not this project's token names or hex values.
4. Choose a `kind` in one lowercase word: card, table, form, nav, header, hero, list, modal, button, input, section, page.
5. Run `save` with `--name`, `--kind`, `--recipe`, `--code-file`, and `--tags`, `--stack`, `--project` when known. Add `--screenshot` if you have a screenshot file of it.
6. Tell the user the name it was saved under.

Never save secrets, real customer data or API keys that appear in the code; replace them with placeholders first.

## List and show

- `list` shows names, kinds, tags and recipes. Filter with `--kind` or `--search`.
- Present entries as a short table: name, kind, where it came from, one line of the recipe.
- `show <id>` returns the full entry with code.

## Use in this project

1. `show <id>` to get the recipe and reference code.
2. Read this project's stack, tokens and `design-system/MASTER.md`.
3. Rebuild the design for this project: same structure and relationships, this project's tokens, data fields, icons and component library. Do not paste the reference code unchanged, and do not import another project's token names.
4. Show it before applying. When a browser is available, add it as a draft in an explore comparison so the user sees it next to the current design.
5. Say what you had to change to fit this project, and what could not carry over.

## Remove

`remove <id>` deletes an entry. Confirm the name with the user first; this cannot be undone.
