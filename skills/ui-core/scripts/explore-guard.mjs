#!/usr/bin/env node
// ui-creator · Copyright (c) 2026 Murtaza Mehdi Yucal · MIT License · https://github.com/murtazayucal/ui-creator
// Keeps the temporary explore code out of commits while design mode or a comparison is open.
//
//   node explore-guard.mjs install --project <path>
//   node explore-guard.mjs remove  --project <path>
//   node explore-guard.mjs status  --project <path>
//
// install does two things, both local to this clone and neither tracked by git:
//   1. adds the helper folder and the session record to .git/info/exclude, so `git add -A` skips them;
//   2. adds a pre-commit check that refuses a commit whose staged changes still refer to the explore
//      helpers (the wrapper around a component, the dock import in the entry file) or that stage a draft file.
// The check is plain shell and needs nothing installed. `git commit --no-verify` skips it.
// If the project keeps its hooks in a tracked folder (husky and similar), the hook is not installed,
// because that would change a file the team shares; the exclude entries still are, and the result says so.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const [cmd, ...rest] = process.argv.slice(2);
const i = rest.indexOf("--project");
const project = path.resolve(i >= 0 && rest[i + 1] ? rest[i + 1] : ".");
const out = (x) => console.log(JSON.stringify(x, null, 2));
const git = (...args) => execFileSync("git", args, { cwd: project, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

const BEGIN = "# >>> ui-creator explore guard >>>";
const END = "# <<< ui-creator explore guard <<<";
// Only the helper folder and the session record are hidden from git. Draft files are NOT listed here:
// Tailwind 4 (and other tools that find sources through git's ignore rules) skip ignored files, so an
// ignored draft renders without its classes. Drafts are kept out of commits by the check below instead.
const EXCLUDES = ["__explore__/", "design-system/explore.json"];
const DRAFT_FILES = "(\\.drafts[./]|\\.current\\.(vue|svelte|component\\.ts)$)";
// What a staged change must not add while a comparison is open.
// Narrow on purpose: ordinary code has `ref.current.focus()` and `state.drafts.map(...)`, which must pass.
const PATTERN = "__explore__/|explore-slot|ExploreSlot|ui-explore-slot|explore-dock|\\.drafts[\\\"'/]|\\.drafts\\.(jsx?|tsx?|vue|svelte)|\\.current\\.(vue|svelte|component)";

const HOOK = `${BEGIN}
# Added by the ui-creator plugin while an explore comparison is open. Removed when it is closed.
if git diff --cached -U0 --no-color | grep -E '^\\+[^+]' | grep -Eq "${PATTERN}" || git diff --cached --name-only --diff-filter=AM | grep -Eq "${DRAFT_FILES}"; then
  echo "ui-creator: this commit still contains temporary explore code (a comparison or design mode is open)." >&2
  echo "Finish or discard the comparison first, or commit with --no-verify to override." >&2
  git diff --cached --name-only | sed 's/^/  staged: /' >&2
  exit 1
fi
${END}
`;

let gitDir, hooksDir, hooksTracked;
try {
  gitDir = path.resolve(project, git("rev-parse", "--git-dir"));
  hooksDir = path.resolve(project, git("rev-parse", "--git-path", "hooks"));
  // A hooks folder outside .git is shared with the team (core.hooksPath).
  hooksTracked = !hooksDir.startsWith(gitDir + path.sep);
} catch {
  out({ ok: false, error: "not a git repository", project: project.replace(/\\/g, "/") });
  process.exit(0);
}

const excludeFile = path.join(gitDir, "info", "exclude");
const hookFile = path.join(hooksDir, "pre-commit");
const read = (f) => (fs.existsSync(f) ? fs.readFileSync(f, "utf8") : "");
const strip = (text) => {
  const a = text.indexOf(BEGIN);
  const b = text.indexOf(END);
  return a >= 0 && b > a ? text.slice(0, a) + text.slice(b + END.length).replace(/^\n/, "") : text;
};
const state = () => ({
  exclude: read(excludeFile).includes(BEGIN),
  hook: read(hookFile).includes(BEGIN),
  hooksSharedWithTeam: hooksTracked,
});

if (cmd === "status") {
  out({ ok: true, ...state() });
} else if (cmd === "install") {
  fs.mkdirSync(path.dirname(excludeFile), { recursive: true });
  fs.writeFileSync(excludeFile, strip(read(excludeFile)).replace(/\n*$/, "\n") + `${BEGIN}\n${EXCLUDES.join("\n")}\n${END}\n`);

  let hook = "not installed";
  if (hooksTracked) {
    hook = "skipped: this project keeps hooks in a shared folder; add the check there yourself or rely on the warning";
  } else {
    fs.mkdirSync(hooksDir, { recursive: true });
    const existing = strip(read(hookFile));
    const body = existing.trim() ? existing.replace(/\n*$/, "\n") + HOOK : `#!/bin/sh\n${HOOK}`;
    fs.writeFileSync(hookFile, body, { mode: 0o755 });
    hook = existing.trim() ? "added to the existing pre-commit hook" : "installed";
  }
  out({ ok: true, hook, ...state(), note: "Local to this clone; nothing tracked by git was changed." });
} else if (cmd === "remove") {
  if (fs.existsSync(excludeFile)) fs.writeFileSync(excludeFile, strip(read(excludeFile)));
  if (!hooksTracked && fs.existsSync(hookFile)) {
    const rest = strip(read(hookFile));
    // Delete the hook file when nothing but the shebang is left of it.
    if (rest.replace(/^#!.*\n?/, "").trim() === "") fs.rmSync(hookFile);
    else fs.writeFileSync(hookFile, rest, { mode: 0o755 });
  }
  out({ ok: true, ...state() });
} else {
  out({ ok: false, error: "usage: explore-guard.mjs install|remove|status --project <path>" });
}
