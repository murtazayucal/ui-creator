# States

Missing states are the most mechanically detectable UX defect. Check every interactive element and every data view against these lists.

## Interactive elements

| State | Requirement | Probe |
|---|---|---|
| Default | Looks interactive only if it is | — |
| Hover | More contrast than default | no `hover:` variant |
| Focus-visible | Visible ring, ≥ 3:1; use `:focus-visible`, not `:focus` | `outline-none` with no replacement |
| Active / pressed | Distinct from hover | no `active:` variant |
| Disabled | Looks inert; `disabled` or `aria-disabled` set | no `disabled:` variant |
| Loading | Disabled, original label kept, indicator added | async handler with no pending UI |
| Selected / current | `aria-selected`, `aria-checked` or `aria-current` set | nav link with no current style |
| Invalid | `aria-invalid` plus a message linked with `aria-describedby` | input with no error slot |

The hit area matches what looks clickable. A checkbox and its label are one target.

## Data views

Any component that loads or lists data needs a branch for each.

| State | What to show |
|---|---|
| Loading | Skeleton that mirrors the final layout |
| Empty, first use | What this is, and one primary action to create the first item |
| Empty, no results | The query that produced nothing, and a way to reset it |
| Error | What happened and a retry |
| Partial | The data that did load; mark what failed or is still loading |
| Ideal | — |
| Overflow | Very long strings and very large counts do not break the layout |

Probe: a component that calls `useQuery`, `useSWR` or `fetch` and renders `data.map(...)` with no branch for loading, error and `length === 0`.

Every state offers a next step. No dead ends.

## Dialogs

- Focus moves into the dialog on open, stays inside while it is open, and returns to the trigger on close.
- Escape closes it. There is a visible close control.
- Use `<dialog>` or `role="dialog"` with `aria-modal="true"` and a label.
- Do not use a modal for information that does not block the user.
- Sticky headers and overlays must not cover the focused element (WCAG 2.4.11).

## Navigation

- Links are `<a>` or the framework's `<Link>`, never a `<button>` or `<div>`, so Ctrl-click and middle-click work.
- Filters, tabs and pagination live in the URL.
- The page `<title>` reflects where the user is.
- A "Skip to content" link exists.

## Tables

- Use a native `<table>`.
- Numbers use `font-variant-numeric: tabular-nums` and align right.
- Long lists are virtualized or paginated.

## Stress content

Before calling a component done, look at it with: a very long title, a missing image, zero items, one item, many items, and at 320px wide.
