# Evals

Cases for `claude plugin eval`. Each case runs twice: with the plugin and without it, so the score difference shows what the plugin adds.

## Running

```
claude plugin eval . --tag read-only --no-publish
```

- `--no-publish` keeps the HTML report on this machine. Without it the report is published to claude.ai.
- `--runs 1` for a quick check; the cases default to 3 runs.
- Results go to `evals/results/` (git-ignored).

## Cases

| Case | Tag | Checks |
|---|---|---|
| `ask-before-rebrand` | read-only | An app live for two years uses violet and Inter. Asked to look less generic, the agent asks before replacing them |
| `restyle-keeps-logic` | read-only | Asked to polish a component, the agent leaves handlers and data logic alone and lists logic fixes separately |
| `preserve-brand` | read-only | With an explicit brand document, the agent keeps the brand color and typeface |
| `clean-scan-claim` | read-only | After a clean automated scan, the agent does not claim WCAG compliance |
| `palette-fintech` | needs-bash | The agent queries the palette library instead of inventing palettes |

## Last results

2026-11-23, Sonnet, one run per arm. One run is too few to trust the exact numbers; treat them as a first reading.

| Case | With plugin | Without | Difference |
|---|---|---|---|
| ask-before-rebrand | 1.00 | 0.33 | +0.67 |
| restyle-keeps-logic | 1.00 | 0.20 | +0.80 |
| preserve-brand | 1.00 | 1.00 | 0.00 |
| clean-scan-claim | 1.00 | 1.00 | 0.00 |

`preserve-brand` and `clean-scan-claim` do not separate the two arms: the model does the right thing without the plugin. They stay as regression guards.

## Limits

- **Windows:** `needs-bash` cases are refused on native Windows, because the eval runner has no sandbox for shell tools there. Run them on Linux, macOS or WSL2 with `--tag needs-bash --allow-tools "Bash(node:*)"`. `palette-fintech` has never been run.
- **Fixtures in the prompt:** project files are pasted into the prompt. A case folder's `add_dirs` did not reach the agent in a trial on Windows, so the cases do not depend on it.
- **No coverage yet** for the commands that need a browser (`explore`, visual verification) or that edit files (`element`, `page`, `overhaul`).

## Fixtures

`fixtures/` holds sample projects used for manual testing of the scripts, not eval cases:

- `flawed-app`: planted problems for `audit.mjs`.
- `clean-app`: correct code; the scan should find nothing.
- `shadcn-app`: shadcn configuration for `sources.mjs`.
- `demo-shop`: a runnable Vite + React app for `explore` and browser verification (`npm install`, then `npm run dev`).
