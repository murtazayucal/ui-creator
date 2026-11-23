# Changelog

What changed in each version of ui-creator. Newest first.

To get new versions automatically, turn on auto-update for the marketplace: in Claude Code run `/plugin`, open the **Marketplaces** tab, select `ui-creator` and turn auto-update on. To update by hand, see [Staying up to date](README.md#staying-up-to-date).

## 0.8.4 (2026-11-23)

- **Angular 22.** The Angular adapters no longer import `ComponentFactoryResolver`, which Angular 22 removed, so comparisons build and run there. Run in a browser on Angular 22.3 and, for the old fallback, on Angular 12.2.
- **Finds your running app.** A new script reads the port your project is set up for, checks which local ports answer, and confirms the answer is this project, so the browser opens on the right address without asking you. It asks only when it cannot tell.
- **Applying is calmer.** The component is rewritten in one step before the temporary files are removed, so the page does not pass through a broken state, and the bar says "Applying…" across the reloads.

## 0.8.3 (2026-11-23)

- `explore` checks its drafts against the list of machine-made looks before showing them: a tell has to earn its place or be redrawn, and two drafts that differ only in decoration are not two alternatives. What you asked for (a design language, a note) is never treated as a tell.
- The list gained rules for interface text, with English and Turkish examples. They apply to text a draft adds, never to text that is already there.

## 0.8.2 (2026-11-23)

- The `explore` command reads about half as much text when it starts. Its instructions for browser clicks, framework details, design-language rounds and design mode moved into separate files that are read only when needed. No behavior is meant to change.
- Its description of the bar and dock now matches the 0.8.0 interface.

## 0.8.1 (2026-11-23)

- Prepared for the Claude plugin directory: the palette data is split into parts under the size limit for one file, an example app's launcher is pinned to an exact version, and an oversized lockfile is gone. Palette results are unchanged.
- README: a section on everything the plugin runs and writes on your machine.

## 0.8.0 (2026-11-23)

- **Shorter bar.** Scope and drafts, three view tools, New variations, Apply, and a menu. New variations opens a small form with the note and the Style window; Save, Remove and Close comparison moved into the menu. The arrow-key hint is gone; the arrow keys still step through drafts.
- **Fine-tune.** Typeface (the project's own fonts and fifteen system families), text size, weight, corners and padding, changed in the browser with no request to the agent, for every instance of a component or for one. The result is sent with Apply, Save and New variations.
- **Focus view.** One small element enlarged on a dark backdrop with its current design and every draft beside it. Fine-tuning shows there as you change it.
- **Narrow view**, replacing the phone preview. A frame docked at the right edge; drag its edge to change the width, with the project's own breakpoints one click away. It follows the bar as you switch drafts, finds content wider than the screen or spilling out of its box, cut text and tap targets under 24px, marks them, and hands the list to the agent with one click. Clicking an element inside it asks for variations for that width only.
- The phone preview no longer opens a second copy each time its button is pressed.

## 0.7.1 (2026-11-23)

- Copyright notice on the first line of every script, helper and adapter, including the helper files copied into a project.
- The dock's Settings shows the plugin name and author, linking to the repository.

## 0.7.0 (2026-11-23)

- **Close a comparison** from the bar without applying anything.
- **Dock menu**: compare the whole page, close all comparisons, and Settings.
- **Settings**: the tool's own look, dark or light, with four accent colors, kept in the browser.
- Draft badges hide when everything shows the same draft, and no longer cover small elements or get clipped.
- README: animated walkthroughs of the explore flow and of the twelve design languages.

## 0.6.0 (2026-11-23)

- **Style window**: twelve design languages to pick from, mix two, or describe your own.
- **Include or exclude nested components** on the page itself when the picked area holds other components.
- **One bar** however many comparisons are open, with a scope selector for all of them or one component.
- The tool's own interface redrawn: status dot, keycap draft buttons, icons for rare actions.
- Fix: the commit guard no longer hides draft files from Tailwind 4, which left drafts unstyled.

## 0.5.0 (2026-11-23)

- Comparisons on **Vue 2.6 and 2.7** and **Svelte 3 and 4**, next to Vue 3, Svelte 5, React and Angular.
- **Commit guard**: a local check that keeps temporary comparison code out of your history.
- The listener stays up between clicks instead of being started for each one.

## 0.4.0 and earlier (2026-11-23)

- First versions: the `audit`, `palette`, `sources`, `element`, `page`, `overhaul`, `explore` and `library` commands and the shared `ui-core` skill.
- The explore bar: switch drafts, phone preview, and (with the local listener) request, remove, save and apply drafts from the browser.
- An always-on element picker dock and a personal design library.
- Comparisons on Vue 3, Svelte 5 and Angular in addition to React.
