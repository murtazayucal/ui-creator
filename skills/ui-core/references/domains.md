# Surfaces and domains

The numeric floors in `ux-rules.md` apply everywhere. What changes by surface is weighting: which rules matter most. Identify the surface first.

For color direction by product category, query `palette.mjs --domain <name>`; the data is in `data/domains.json`. This file covers everything except color.

## Detecting the surface

Route names (`/pricing`, `/checkout`, `/dashboard`, `/settings`), chart or table libraries in the dependencies, how many forms there are, and whether auth or payment components exist. One app often has several surfaces; judge each page by its own.

## Profiles

| Surface | Weigh most | Notes |
|---|---|---|
| Marketing, landing | Distinct identity, hero hierarchy, one primary action per screen, load speed, short copy | Expressive type and motion are fine. One orchestrated page-load sequence beats scattered micro-animations. Apply `anti-patterns.md` fully |
| Web app, SaaS | Consistency, complete states, keyboard and URL behavior, forms, density | Restrained motion. Neutral or system fonts are acceptable. Calm editorial layouts suit this surface badly |
| Dashboard, data-heavy | Table and chart legibility, density, loading and partial states, filters kept in the URL | Tabular numerals. Color-blind-safe chart colors, never color alone. Avoid one card per metric |
| Mobile web | 44–48px targets, 16px inputs, safe areas, no hover-only controls, reflow at 320px | Primary actions within thumb reach |
| E-commerce | Checkout forms: single column, labels above, few fields, inline validation | Neutral surfaces so product images lead. Consistent price formatting |
| Fintech | Review step before an irreversible transaction, exact number formatting, explicit status, session-timeout warning | WCAG 3.3.4: legal and financial submissions are reversible, checked or confirmed. WCAG 2.2.1: warn before timeout and allow extension |
| Healthcare, government | Plain language, one question per screen for complex forms, error summary plus inline error, no time pressure | AA is a hard floor. Larger default text |

The fintech and healthcare rows are derived from WCAG criteria and general practice; no domain-specific primary source was checked.

## Applying a profile

- A profile changes priority, not the rules. A contrast failure is severity 3 on every surface.
- In transactional flows (sign-in, checkout, settings) follow convention even when the brand is expressive elsewhere.
- Format numbers, dates and currency with the locale. Detect language from the browser, never from IP.
