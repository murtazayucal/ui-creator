# Explore: frameworks and adapters

Read this when setting up a comparison in a project, to choose the adapter and the file layout for its framework and version.

The bar, the draft switching and the picker are plain JavaScript in `explore-core.js` and `explore-pick.js`. Each framework needs only a thin adapter that renders the chosen draft. Copy the adapter for the project's framework; its header comment shows the exact wrapper to write.

| Framework | Versions run in a browser | Adapter file | Drafts | Where the original goes during the comparison |
|---|---|---|---|---|
| React | 16.8, 16.14, 17, 18, 19; Next.js 16 App Router | `explore-slot.jsx` | functions in `<Name>.drafts.jsx` | stays in its file, renamed `<Name>Current` |
| Vue 3 | 3.5 | `ExploreSlot.vue` | one `.vue` file per draft in `<Name>.drafts/`, listed in `<Name>.drafts.js` | moved to `<Name>.current.vue` |
| Svelte 5 | 5 | `ExploreSlot.svelte` | one `.svelte` file per draft in `<Name>.drafts/`, listed in `<Name>.drafts.js` | moved to `<Name>.current.svelte` |
| Vue 2 | 2.6, 2.7 | `explore-slot.vue2.js` | as Vue 3 | as Vue 3 |
| Svelte 3 and 4 | 3.59, 4.2 | `ExploreSlotLegacy.svelte` | as Svelte 5 | as Svelte 5 |
| Angular, standalone components | 15, 16, 17, 20, 21 | `explore-slot.angular.ts` | one standalone component per draft in `<name>.drafts/`, listed in `<name>.drafts.ts` | moved to `<name>.current.component.ts` with class and selector renamed |
| Angular, NgModule | 12, 13, 14, 18, 19, 21 | `explore-slot.angular-module.ts` | one component per draft, declared in the same NgModule | as above, and declared in the NgModule |

Pick the adapter by reading the project, not by guessing:

- **React.** The adapter is a class behind a plain function, so it needs no hooks and works with either JSX transform. In a TypeScript project rename it to `.tsx`; the wrapper you write type-checks against it. In Next.js App Router only client components can be wrapped (the wrapper file needs `"use client"`), and the dock is rendered with `explore-dock-client.jsx` in the root layout, not imported from a server file.
- **Angular.** Check `@angular/core` in `package.json` and whether the component has `standalone: true` or is listed in an NgModule's `declarations`. Use the module adapter for anything declared in an NgModule and for Angular 12 and 13. From Angular 19 on, add `standalone: false` to the module adapter, the wrapper, the current component and the drafts, as the adapter's header says. Both adapters fall back to a component factory on Angular 12 and to plain property assignment where `setInput` does not exist.
- **Vue.** Check the major version of `vue` in `package.json`. On Vue 2 the wrapper passes `:bind="$props"` and `:on="$listeners"`, and sets the current component and the drafts in `created()`, not in `data()`; the adapter's header shows the wrapper.
- **Svelte.** Check the major version of `svelte`. On Svelte 3 and 4 component events cannot be forwarded as a group: read which events the component dispatches and re-dispatch each one in the wrapper's `on` object, as the adapter's header shows. Miss one and that handler silently stops working during the comparison.
- **Other versions.** Angular 11 or older and Vue 1 have no adapter. Say so, and offer static previews of each draft instead.

In Vue, Svelte and Angular a file holds one component, so the original moves to a `.current` file and the component's own file becomes a thin wrapper with the same props, events and selector. Usage sites stay untouched in every framework.

A version in the table was built and driven in a browser with this plugin's test apps; a version between two tested ones is expected to work. Tell the user when their version is outside the table.
