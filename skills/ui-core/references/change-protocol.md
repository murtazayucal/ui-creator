# Change protocol

The steps every command that edits UI follows. `<core>` is this skill's folder.

## Before editing

1. **Base to compare against.** Run `git status`. If there are uncommitted changes, ask the user to commit or stash them first; `check-diff.mjs` needs a clean base. If the project is not a git repository, say that the logic check cannot run and ask whether to continue without it.
2. **Stack.** `node <core>/scripts/detect-stack.mjs <project>`. The framework, styling approach and component library stay as they are.
3. **Design record.** Read `design-system/MASTER.md` and, for a page, `design-system/pages/<page>.md`. If there is no record, create one from `<core>/assets/MASTER.template.md` when the first decision is made; fill only what you know and leave the rest empty.
4. **Sources.** If `design-system/sources.json` exists, use only what it lists.
5. **Boundaries.** Ask which files or areas must not be touched, once per session.
6. **Baseline.** `node <core>/scripts/audit.mjs <target>` and keep the summary for the report. If a browser is available, also capture the "before" set described in `verification.md`.

## While editing

- Markup, classes and styles only. No changes to data fetching, state, handlers, routing or types.
- If a fix needs logic (a loading branch, a confirm step, turning a clickable `div` into a `button` with a keyboard handler), list it separately and ask before making it.
- Use existing tokens. Add a token only for a value that will be reused; never rename existing ones.
- A raw palette class (`bg-gray-100`, `text-slate-500`) is a raw value too. When no token fits a hover, surface or border color you need, add one token for it or name the gap in the report; do not scatter palette classes.
- A new token is a design decision: record it in `design-system/MASTER.md`.
- Prefer the shared component or token over patching each use. Count usages before touching shared code and tell the user the number.
- Keep batches small: one component, one page, or one token group at a time.
- Do not invent copy, statistics, testimonials or images.

## After each batch

1. `node <core>/scripts/check-diff.mjs --project <project>`.
   - `style-only` and `docs`: fine.
   - `markup`: read the sample and confirm nothing was removed that the user relies on.
   - `logic` or `non-ui`: each such line must be one the user agreed to. Otherwise revert it.
2. `node <core>/scripts/audit.mjs <target>` again and compare with the baseline. No new findings.
3. Run the project's `lint` and `typecheck` scripts when they exist (`detect-stack.mjs` lists them).
4. Check contrast of any color pair you introduced with `contrast.mjs`.
5. Verify in a browser following `verification.md`: measure with `assets/verify/page-check.js` before and after, compare with `verify-compare.mjs`, then look. If no browser is available, say "not visually checked".

Take the "before" measurements and screenshots as part of the baseline, before the first edit; they cannot be recovered afterwards without reverting.

## Report

- What changed, per file, in one line each.
- Audit before and after (counts per severity).
- `check-diff` summary, and every `logic` or `non-ui` change with the reason it was agreed.
- What was verified and how; what was not.
- Fixes that need logic changes and are waiting for a decision.

Do not commit, push or merge unless the user asks.
