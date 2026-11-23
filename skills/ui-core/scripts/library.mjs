#!/usr/bin/env node
// ui-creator · Copyright (c) 2026 Murtaza Mehdi Yucal · MIT License · https://github.com/murtazayucal/ui-creator
// The user's personal design library: designs they liked, kept outside any project so they can be
// reused in another one. Stored in ~/.ui-creator/library (override with UI_CREATOR_LIBRARY).
//
//   node library.mjs save --name "Dark stat card" --kind card --recipe "<what makes it this design>"
//                         --code-file <path> [--tags dark,dashboard] [--stack "react,tailwind4"]
//                         [--project <name>] [--screenshot <image path>] [--id <id to overwrite>]
//   node library.mjs list [--kind card] [--search dark] [--limit 20]
//   node library.mjs show <id>            full entry including the code
//   node library.mjs remove <id>
//   node library.mjs where                print the library folder
//
// An entry is a recipe plus reference code, not a drop-in component: adapt it to the target project's
// tokens, data and component library. Output is JSON.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const [cmd, ...rest] = process.argv.slice(2);
const opt = (n) => {
  const i = rest.indexOf(`--${n}`);
  return i >= 0 && rest[i + 1] && !rest[i + 1].startsWith("--") ? rest[i + 1] : null;
};
const positional = rest.find((a, i) => !a.startsWith("--") && !(rest[i - 1] ?? "").startsWith("--"));
const out = (x) => console.log(JSON.stringify(x, null, 2));
const fail = (error, extra = {}) => {
  out({ ok: false, error, ...extra });
  process.exit(0);
};

const root = path.resolve(process.env.UI_CREATOR_LIBRARY || path.join(os.homedir(), ".ui-creator", "library"));
const ID = /^[a-z0-9][a-z0-9-]{0,59}$/;
const slug = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
const entryDir = (id) => path.join(root, id);
const readMeta = (id) => {
  try { return JSON.parse(fs.readFileSync(path.join(entryDir(id), "meta.json"), "utf8")); } catch { return null; }
};
const all = () => {
  let ids = [];
  try { ids = fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory() && ID.test(d.name)).map((d) => d.name); } catch {}
  return ids.map(readMeta).filter(Boolean).sort((a, b) => String(b.saved).localeCompare(String(a.saved)));
};

if (cmd === "where") {
  out({ ok: true, library: root.replace(/\\/g, "/"), entries: all().length });
} else if (cmd === "save") {
  const name = opt("name");
  const kind = slug(opt("kind") ?? "");
  const recipe = opt("recipe");
  const codeFile = opt("code-file");
  if (!name || !kind || !recipe || !codeFile) fail("save needs --name, --kind, --recipe and --code-file");
  let code;
  try { code = fs.readFileSync(path.resolve(codeFile), "utf8"); } catch (e) { fail("cannot read --code-file", { detail: e.message }); }
  if (code.length > 200_000) fail("code file is larger than 200 KB; save the component, not the whole app");

  let id = opt("id");
  if (id && !ID.test(id)) fail("bad --id");
  if (!id) {
    const base = slug(name) || "design";
    id = base;
    for (let n = 2; fs.existsSync(entryDir(id)); n++) id = `${base}-${n}`;
  }
  const dir = entryDir(id);
  fs.mkdirSync(dir, { recursive: true });
  const ext = path.extname(codeFile) || ".txt";
  const codeName = `code${ext}`;
  fs.writeFileSync(path.join(dir, codeName), code);

  let screenshot = null;
  const shot = opt("screenshot");
  if (shot) {
    try {
      const sext = path.extname(shot).toLowerCase();
      if (![".png", ".jpg", ".jpeg", ".webp"].includes(sext)) throw new Error("screenshot must be png, jpg or webp");
      screenshot = `screenshot${sext}`;
      fs.copyFileSync(path.resolve(shot), path.join(dir, screenshot));
    } catch (e) {
      screenshot = null;
      console.error("screenshot not saved: " + e.message);
    }
  }
  const meta = {
    id,
    name,
    kind,
    recipe,
    tags: (opt("tags") ?? "").split(",").map((t) => slug(t)).filter(Boolean),
    stack: (opt("stack") ?? "").split(",").map((t) => t.trim()).filter(Boolean),
    project: opt("project"),
    saved: new Date().toISOString().slice(0, 10),
    code: codeName,
    screenshot,
  };
  fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify(meta, null, 2) + "\n");
  out({ ok: true, saved: meta, folder: dir.replace(/\\/g, "/") });
} else if (cmd === "list") {
  const kind = slug(opt("kind") ?? "");
  const search = (opt("search") ?? "").toLowerCase();
  const limit = Math.max(1, parseInt(opt("limit") ?? "20", 10) || 20);
  const hits = all().filter((m) => (!kind || m.kind === kind) && (!search || `${m.name} ${m.recipe} ${m.tags.join(" ")} ${m.kind}`.toLowerCase().includes(search)));
  out({
    ok: true,
    library: root.replace(/\\/g, "/"),
    total: all().length,
    matched: hits.length,
    kinds: [...new Set(all().map((m) => m.kind))],
    entries: hits.slice(0, limit).map(({ code, ...m }) => m),
  });
} else if (cmd === "show") {
  if (!positional || !ID.test(positional)) fail("show needs an id");
  const meta = readMeta(positional);
  if (!meta) fail(`no entry with id ${positional}`);
  let code = null;
  try { code = fs.readFileSync(path.join(entryDir(positional), meta.code), "utf8"); } catch {}
  out({
    ok: true,
    entry: meta,
    screenshotPath: meta.screenshot ? path.join(entryDir(positional), meta.screenshot).replace(/\\/g, "/") : null,
    code,
    note: "Reference code from another project. Rebuild it with this project's tokens, data fields and component library; do not paste it in unchanged.",
  });
} else if (cmd === "remove") {
  if (!positional || !ID.test(positional)) fail("remove needs an id");
  const dir = entryDir(positional);
  if (!readMeta(positional)) fail(`no entry with id ${positional}`);
  fs.rmSync(dir, { recursive: true, force: true });
  out({ ok: true, removed: positional });
} else {
  fail("unknown command", { commands: ["save", "list", "show <id>", "remove <id>", "where"] });
}
