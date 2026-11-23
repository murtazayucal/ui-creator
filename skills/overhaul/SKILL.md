---
name: overhaul
description: Rework the UI of a whole application consistently: inventory, design record, approved direction, then tokens, components and pages with verification.
disable-model-invocation: true
---

# Overhaul

Reply in the user's language. This changes many files. It runs in phases and stops for the user at each **Stop**.

Core files: `${CLAUDE_PLUGIN_ROOT}/skills/ui-core/`. Read `references/change-protocol.md` there first; every editing batch follows it.

## Phase 1: Understand (no edits)

1. **Guard.** Uncommitted changes must be committed or stashed. Offer to create a branch for the work; create it only on a yes. Ask which files or areas must not be touched.
2. **Stack and sources.** `detect-stack.mjs`. If `design-system/sources.json` is missing, suggest running `sources` first; continue without it if the user prefers.
3. **Inventory.** List routes or pages, shared components with usage counts, and the tokens in use.
4. **Audit.** Follow the `audit` command's steps for the whole project. Keep the summary as the baseline.
5. **Summarize** for the user: what the product is, the surface types found, the five root causes that explain most findings, and what is good and should be kept.

**Stop.** The user confirms the summary and what to preserve.

## Phase 2: Direction

6. **Color.** If the color system is part of the problem, follow the `palette` command's steps to get candidates. Keep brand colors the user wants kept.
7. **Propose 2–3 directions.** Each is a short written brief (color, type, spacing and shape, component treatment) plus a rendered preview of one real page from the app. Directions must differ in more than color. Where `references/anti-patterns.md` applies, check each against it.

**Stop.** The user picks one, or asks for another round.

8. **Write `design-system/MASTER.md`** from `assets/MASTER.template.md`: the chosen direction as tokens and rules, what is preserved, and the decision with the rejected alternatives.

**Stop.** The user approves the record. Nothing is restyled before this.

## Phase 3: Apply

Work in this order. Each numbered item is one batch under the change protocol, with a report after it.

9. **Tokens.** Follow "Making an app-wide change" in `references/tokens.md`. Check every text/surface pair with `contrast.mjs`.
10. **Shared components**, most used first. One component per batch.
11. **Pages**, most visited first. One page per batch, following the `page` command's diagnosis.

Fixes that need logic are collected in a list during these batches and offered together at the end.

If a batch produces `logic` or `non-ui` changes that were not agreed, or new audit findings, stop and fix that before the next batch.

## Phase 4: Verify

12. **Audit again** and compare with the baseline.
13. **Measure and review separately**, following `references/verification.md`. Compare the before and after `page-check` results with `verify-compare.mjs`. Then give a fresh reviewer (a subagent with no part in the edits) `assets/verify/reviewer-brief.md`, the screenshots, the comparison and `MASTER.md`. Check each of its findings against the page before acting on it.
14. **Final report:** audit before and after, files changed per phase, what was verified and how, what was not, and the open list of logic fixes.

Do not commit, push or merge unless the user asks.
