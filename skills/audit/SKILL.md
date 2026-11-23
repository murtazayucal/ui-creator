---
name: audit
description: Audit a UI against UX, accessibility and consistency rules and report findings by severity without changing code.
argument-hint: "[path or route]"
disable-model-invocation: true
---

# Audit

Reply in the user's language. Target: `$ARGUMENTS`; if empty, the whole project. This command reports only. Do not edit files.

Core files are in `${CLAUDE_PLUGIN_ROOT}/skills/ui-core/` (`scripts/`, `references/`, `data/`).

## Steps

1. **Detect.** Run `node "${CLAUDE_PLUGIN_ROOT}/skills/ui-core/scripts/detect-stack.mjs" <project>`. Read `design-system/MASTER.md` if present. Identify the surface (marketing, app, dashboard, mobile, e-commerce) with `references/domains.md`.
2. **Scan.** Run `node "${CLAUDE_PLUGIN_ROOT}/skills/ui-core/scripts/audit.mjs" <target>`. It returns findings grouped by rule and sorted by severity, plus `notChecked`: the rules it cannot test.
3. **Confirm the scan.** The detectors are text patterns. Open the reported locations for each severity-3 group and drop false positives before reporting. Raise a finding to 4 when it sits on a core flow (sign-in, checkout, the page's primary action).
4. **Check what the scan cannot.** Work through `notChecked`:
   - `rendered` rules: if a dev server and browser are available, evaluate the text of `assets/verify/page-check.js` in each main page at 320, 768 and 1280 px (see `references/verification.md`). It measures contrast against real backgrounds, target sizes, overflow and missing names. If no browser is available, compute contrast for the token text/surface pairs with `contrast.mjs` and list the rest as not checked.
   - `judgment` rules: read the main pages and components against `references/ux-rules.md` and `references/states.md`.
5. **Smells.** Apply `references/anti-patterns.md` only where the surface table in that file says to, and never against an established brand.
6. **Report.**
   - A summary: counts per severity and the top root causes.
   - A table sorted by severity: location (`file:line`), rule, what is wrong, fix, scope (element, page, app). One row per root cause with a count, not one row per instance.
   - What was measured, what was judged by reading, and what was not checked.
7. **Offer** to fix a chosen group with `element`, `page` or `overhaul`. Token-level root causes first: they clear the most findings per change.

## Rules of reporting

- Severity comes from the rule (`data/rules.json`), not from impression.
- Never report "accessible" or "WCAG compliant". A clean scan means no automatically detectable issues were found.
- Conventions (spacing grid, animation timing) are suggestions, not failures.
- Suppress a known false positive by adding the comment `audit-ignore` on that line; mention it when you do.
