# Verification

How to check a UI change in a real browser. A change is not verified until you have looked at it rendered.

## What to capture

Capture the same set before the change and after it.

| Dimension | Values |
|---|---|
| Pages | every page the change touches; for a shared component, at least two pages that use it |
| Widths | 375 (mobile), 768 (tablet), 1280 (desktop). Add 320 when checking reflow. When the change adds or moves a breakpoint, add one width inside every range between breakpoints (for breakpoints at 640, 768 and 1280: also 700 and 1100); the layout between two tested widths can differ from both |
| Theme | light, and dark if the app has one |
| States | default; then hover and focus on one of each changed control; loading, empty and error views where they exist |

For a single component, one page at 375 and 1280 is enough.

## Opening the app

Find the running app yourself before asking the user for an address: run `node "${CLAUDE_PLUGIN_ROOT}/skills/ui-core/scripts/dev-server.mjs" --project <project>`. It reads the port the project is set up for, checks which local ports answer, and confirms that what answers is this project.

- **`best` is set:** open that address in the browser. If a tab already shows it, use that tab and reload it; do not open a second one.
- **Several candidates, or `ask` is true:** show the user the addresses in `running` with the reason for each and ask which one, or for the address.
- **Nothing is running and `start` is set:** start that command as a background command, wait for its ready line, and run the script again. Do not start a second server on another port for a project that already has one.
- **Nothing is running and there is no dev script:** ask the user how to start the app, or for the address.

After you change a file, look at the page before you judge it. Most dev servers update the page by themselves; when the change is not there (the old text or class is still in the page), reload it. Reload also after changing a config file, a stylesheet entry or anything the dev server reads once at start.

## Procedure

1. **Make sure you see the current build.** Reload after editing. Confirm one specific change is present in the page (a class, a text, a size) before judging anything. A stale page is the most common false pass.
2. **Measure.** Read `assets/verify/page-check.js` and evaluate its text in the page once; it defines `__uiPageCheck()` and returns a first report. After each resize call `__uiPageCheck()` again. The function survives hot reload but not a full page reload; evaluate the file again after one. Collect the reports in the page (for example in an array) and return them once as JSON without the `notChecked` field. Save them in a temporary folder as `before.json` and `after.json`, an array of reports each.
3. **Compare.** `node scripts/verify-compare.mjs before.json after.json`. Any rule marked `worse` is a regression to fix or explain.
4. **Look.** Take a screenshot at each width. A full-page screenshot is scaled down and hides spacing and alignment problems: zoom into each region you changed.
5. **Interact.** Tab through the changed controls: focus is visible and in order. Click one action: it still works. Check the browser console for new errors.
6. **Stress** with the content list in `states.md` when a component's layout changed.
7. **Review separately** for anything larger than one component (below).

## What page-check measures

Text contrast against the actual background, target size, horizontal overflow, content spilling out of its box, clipped text, text under 12px, controls and images with no name, heading order, document language and title.

Its `colorScheme` field is the browser's preference, not proof that the app has a dark theme; check for one yourself.

It does not measure: focus visibility, hover and active states, text over images or gradients, content that is not open, meaning carried by color alone, or whether the page looks good. Its report lists these under `notChecked`; carry that list into your own report.

## Separate review

You judge your own work too generously. For a page or a whole-app change, hand the evidence to a reviewer with no part in the edits: a fresh subagent given `assets/verify/reviewer-brief.md`, the before and after screenshots, the `verify-compare` result and `design-system/MASTER.md`. Do not give it your own assessment.

Give the reviewer a screenshot for every width you captured, before and after, and full-page ones for long pages; it reports what it could not see, and each gap is something nobody checked.

Treat its findings as a list to check, not as verdicts: confirm each against the page, fix what is real, and say which you rejected and why. Scores often stop improving after a few rounds, and a middle round can be the best one; keep the round you can defend, not the latest.

## Tools

Use whichever browser tool the session has: a built-in browser pane, a Chrome extension, Playwright or Chrome DevTools MCP. All of them can navigate, resize, run a script and take a screenshot. When the session has none, say "not visually checked" in the report and list what the user should look at; do not describe how the page looks.

## Reporting

- Pages, widths and themes checked.
- `verify-compare` verdict, with each rule that got worse.
- What you saw in the screenshots that the measurements do not cover.
- The reviewer's findings: fixed, rejected with reason, or open.
- What was not checked.

Say "no automatically detectable issues found" for a clean measurement. Never "accessible" or "pixel perfect".
