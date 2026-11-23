# UX rules

Checked 2026-11-23. Each rule is marked **standard** (WCAG 2.2 AA or a primary source with a number), **guideline** (a named source's recommendation) or **convention** (common practice, no primary source). Report conventions as suggestions, never as errors.

Contents: Severity · Numbers · Heuristics · Laws as checks · Forms · Copy · Motion and feedback · What automation cannot tell you

## Severity

Derive severity from the rule that failed, not from impression. A single reviewer's free ratings are unreliable (NN/g).

| Level | Meaning | Examples |
|---|---|---|
| 4 | Blocks a task, or a WCAG A failure on a core flow | keyboard trap, unlabeled required input at checkout, data loss |
| 3 | WCAG AA failure, or a missing error/loading state on a primary flow | text contrast 3.2:1, no focus indicator, 16px icon button |
| 2 | Inconsistency or friction with a workaround | off-token values, weak hierarchy, missing hover state |
| 1 | Cosmetic | optical alignment, `transition: all`, straight quotes |

`audit.mjs` assigns 3 to WCAG A/AA failures because it cannot see flows. Raise to 4 yourself when the finding sits on a core flow (sign-in, checkout, the page's primary action).

Order findings by severity, then reach (how many screens share the root cause), then effort. Group by root cause: "27 uses of `#6b7280` → one token" is one finding.

## Numbers

| Rule | Value | Status | Source |
|---|---|---|---|
| Body text contrast | ≥ 4.5:1 | standard | WCAG 1.4.3 |
| Large text contrast (≥ 24px, or ≥ 18.66px bold) | ≥ 3:1 | standard | WCAG 1.4.3 |
| UI components, icons, input borders, focus rings | ≥ 3:1 against adjacent colors | standard | WCAG 1.4.11 |
| Pointer target | ≥ 24×24 CSS px, or 24px clear spacing | standard | WCAG 2.5.8 |
| Touch target on mobile | 44px | guideline | Vercel; WCAG 2.5.5 (AAA) |
| Touch target on Android | 48dp, 8dp apart | guideline | Android accessibility help |
| Reflow | no horizontal scroll at 320 CSS px wide | standard | WCAG 1.4.10 |
| Text resize | usable at 200% zoom; never disable zoom | standard | WCAG 1.4.4 |
| Text spacing override | must survive line-height 1.5, paragraph 2×, letter 0.12×, word 0.16× | standard | WCAG 1.4.12 |
| Input font size on mobile | ≥ 16px (prevents iOS zoom) | guideline | Vercel |
| Line length for prose | 50–75 characters (`max-width: 65ch`) | guideline | Baymard |
| Body line height | 1.5; tighter for large headings | convention | Tailwind default scale |
| Spacing | multiples of 4px | convention | Tailwind base unit |
| Response feels instant | ≤ 0.1 s | guideline | NN/g |
| Show that work is in progress | > 1 s | guideline | NN/g |
| Percent-done indicator and a way to cancel | > 10 s | guideline | NN/g |
| Spinner or skeleton show-delay | 150–300 ms, then visible ≥ 300–500 ms | guideline | Vercel |
| UI transition duration | 150–300 ms | convention | — |
| Auto-moving content | pause/stop control if it runs > 5 s | standard | WCAG 2.2.2 |
| Flashing | ≤ 3 flashes per second | standard | WCAG 2.3.1 |
| Focus ring that is safe everywhere | 2px outline, ≥ 3:1, 2px offset | guideline | WCAG 2.4.13 (AAA) |
| Nested corner radius | inner = outer − padding | guideline | Vercel |

Breakpoints to check: 320, 768, 1280 px. Tailwind v4 defaults are 640 / 768 / 1024 / 1280 / 1536.

Contrast pass/fail uses the WCAG 2 formula (`contrast.mjs`). WCAG 3 is a working draft with no chosen algorithm; do not fail anything on APCA.

## Heuristics

Nielsen's ten, each with a probe to run on the code.

| # | Rule | Probe |
|---|---|---|
| 1 | Show system status | handlers that `await` or mutate with no pending UI (`isPending`, `disabled`, `aria-busy`) |
| 2 | Speak the user's language | raw enum values, IDs or ISO timestamps rendered as text; `toFixed` where `Intl.NumberFormat` belongs |
| 3 | Give exits | dialogs with no close handler; destructive actions with no confirm or undo |
| 4 | Be consistent | more than one button implementation; the same action named two ways ("Remove" / "Delete") |
| 5 | Prevent errors | free-text inputs for dates, emails, numbers; missing `type`, `inputmode`, `autocomplete` |
| 6 | Recognition over recall | placeholder-only inputs; icon-only buttons with no label or tooltip |
| 7 | Efficiency for frequent use | row actions with no multi-select; forms that do not submit on Enter |
| 8 | Remove what is not needed | more than one primary button in a view; cards nested in cards |
| 9 | Helpful errors | "Something went wrong", "Invalid input" with no next step |
| 10 | Help where needed | empty arrays that render nothing |

## Laws as checks

- **Fitts:** primary actions are large and near where attention already is.
- **Hick:** many unsorted peer options → group them or disclose progressively.
- **Proximity:** the gap inside a group is smaller than the gap between groups (label→input smaller than field→field).
- **Von Restorff:** exactly one visually dominant action per view.
- **Jakob:** transactional flows (sign-in, checkout, settings) follow convention even in an expressive brand.
- **Doherty:** feedback within 400 ms.
- **Postel:** accept loose input (spaces in card numbers, trailing whitespace) and normalize it.
- **Goal-gradient:** multi-step flows show progress.
- **Miller / chunking:** chunk long forms and long numbers. This is not a "max 7 menu items" rule.

## Forms

NN/g, GOV.UK, Baymard and Vercel agree on these:

- A visible label above every field. A placeholder is not a label.
- Hint text sits between label and input.
- Validate when input is complete (blur or submit), not on the first keystroke. Clear the error as soon as it is fixed.
- Show the error next to the field. On submit, also focus the first invalid field. Never clear what the user typed.
- Single column. Split or collapse when 10–15+ fields would show at once.
- Set `type`, `inputmode`, `autocomplete`, and a meaningful `name`. Never block paste.
- Do not pre-disable submit; let submission surface the errors. While submitting: disable, keep the label, add an indicator.
- Mark required or optional the same way everywhere.
- Do not ask for the same information twice in one flow (WCAG 3.3.7). Authentication must allow password managers and pasted codes (WCAG 3.3.8).

## Copy

- An error says what happened and how to fix it, reusing the label's noun. Empty field: "Enter your first name". Rule broken: "Name must be 35 characters or less".
- Avoid: "invalid", "oops", "something went wrong", "an error occurred", "forbidden", "illegal" (GOV.UK list).
- Button labels name the action: "Save API key", not "Continue" or "OK".
- One noun per thing across the app.

## Motion and feedback

- Honor `prefers-reduced-motion`.
- Animate `transform` and `opacity`. Avoid animating `width`, `height`, `top`, `left`, and never `transition: all`.
- Skeletons match the final layout so nothing shifts.
- Destructive actions need a confirmation or an undo.

## What automation cannot tell you

Automated checks find roughly half of accessibility issues by volume (Deque's own study: 57%). After a clean scan, say "no automatically detectable issues found". Never say "WCAG compliant".

These need judgment: quality of alt text, whether a label is meaningful, logical focus order, whether color is the only cue, whether an error message helps, whether a drag action has a non-drag alternative.
