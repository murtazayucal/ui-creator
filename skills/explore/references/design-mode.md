# Explore: design mode

Read this when the user wants the picker without a comparison open, or invokes the command with no target.

When the user wants to point at things without a comparison already open ("open the picker", "let me click what to change"), or invokes this command with no target, turn design mode on:

1. Copy the helper files from `assets/explore/` (`explore-core.js`, `explore-pick.js`, `explore-styles.js`, `explore-dock.js`, `explore-config.js`, and the adapter for this framework) into an `__explore__` folder at the source root (for example `src/__explore__/`). Fill in the labels in the user's language; leave port and token as they are, the listener sets them. Copy the files whole: the first line of each is the plugin's copyright notice, which its license asks to keep.
2. Add one line to the app's entry file: `import "./__explore__/explore-dock.js";`, marked as temporary in a comment.
3. Start the listener (`explore-listen.mjs wait --config ...`) in the background, install the commit guard (`explore-guard.mjs install`), and record `"dock"` in `design-system/explore.json` (entry file and helper folder).
   In a server-rendered app (Next.js App Router), step 2 is different: copy `explore-dock-client.jsx` too and render `<ExploreDock />` once in the root layout instead of importing the dock file.
4. Tell the user: a small dock sits in the bottom-left corner with **Pick element**, **Style**, **My library** and a menu (compare the whole page, close all comparisons, Settings).

The dock is plain JavaScript and works on any framework with a module bundler. In a development build it names the component on React, Vue, Svelte and Angular, and the source file on Vue and Svelte. Turn design mode off when the user is done: remove the import, and when no comparison is open delete the folder and `explore.json`, stop the listener, and remove the commit guard.
