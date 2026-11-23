#!/usr/bin/env node
// ui-creator · Copyright (c) 2026 Murtaza Mehdi Yucal · MIT License · https://github.com/murtazayucal/ui-creator
// Finds the dev server of a project that is already running on this machine, so the browser can be
// opened on the right address without asking the user for a port.
// Usage: node dev-server.mjs --project <path> [--port <n>]
//
// It reads the project's own files for the port it is set up to use, asks this machine's local ports
// (localhost only, never another host) which of them answer, and checks that what answers is this
// project: the dev server serving this project's package.json, the listening process having been
// started in this project's folder, or the page title matching. It starts nothing and changes nothing.
//
// Output (one JSON object):
//   best     the address to open, or null when it cannot tell
//   running  every candidate that answered, each with `match`: "certain", "likely" or "unknown", and why
//   expected the port the project is configured for, and where that was read
//   start    the command that would start the dev server, when none is running
//   ask      true when the user has to choose or give the address
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const arg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const root = path.resolve(arg("--project") ?? ".");
const fwd = (p) => p.replace(/\\/g, "/");
const read = (p) => {
  try {
    return fs.readFileSync(path.join(root, p), "utf8");
  } catch {
    return null;
  }
};
const json = (p) => {
  try {
    return JSON.parse(read(p));
  } catch {
    return null;
  }
};
const out = (o) => console.log(JSON.stringify(o, null, 2));

const pkg = json("package.json");
if (!pkg) {
  out({ project: fwd(root), best: null, running: [], ask: true, message: "No readable package.json in this folder. Pass the project folder, or ask the user for the address." });
  process.exit(0);
}
const deps = { ...pkg.dependencies, ...pkg.devDependencies };
const scripts = pkg.scripts ?? {};
const scriptName = ["dev", "start", "serve", "develop"].find((s) => scripts[s]);
const script = scriptName ? scripts[scriptName] : "";

// ---- the port the project is set up for ----
const FRAMEWORK_PORT = [
  ["next", 3000], ["nuxt", 3000], ["@remix-run/dev", 3000], ["react-scripts", 3000], ["gatsby", 8000],
  ["@angular/core", 4200], ["astro", 4321], ["@sveltejs/kit", 5173], ["vite", 5173],
  ["@vue/cli-service", 8080], ["webpack-dev-server", 8080], ["parcel", 1234],
];
const usual = FRAMEWORK_PORT.find(([dep]) => dep in deps)?.[1] ?? null;
const num = (s) => {
  const n = Number(s);
  return Number.isInteger(n) && n > 0 && n < 65536 ? n : null;
};
const expected = (() => {
  const given = num(arg("--port"));
  if (given) return { port: given, source: "--port" };
  const inScript = /(?:--port[=\s]+|-p\s+|\bPORT=)(\d{2,5})/.exec(script);
  if (inScript) return { port: num(inScript[1]), source: `package.json script "${scriptName}"` };
  for (const f of ["vite.config.ts", "vite.config.js", "vite.config.mjs", "vite.config.mts", "astro.config.mjs", "svelte.config.js", "nuxt.config.ts", "vue.config.js", "webpack.config.js"]) {
    const m = /\bport\s*:\s*(\d{2,5})/.exec(read(f) ?? "");
    if (m) return { port: num(m[1]), source: f };
  }
  const ng = /"port"\s*:\s*(\d{2,5})/.exec(read("angular.json") ?? "");
  if (ng) return { port: num(ng[1]), source: "angular.json" };
  for (const f of [".env.local", ".env.development", ".env"]) {
    const m = /^\s*PORT\s*=\s*(\d{2,5})/m.exec(read(f) ?? "");
    if (m) return { port: num(m[1]), source: f };
  }
  const launch = json(".claude/launch.json")?.configurations?.find((c) => num(c.port));
  if (launch) return { port: num(launch.port), source: ".claude/launch.json" };
  return usual ? { port: usual, source: "the framework's default" } : null;
})();

// Dev servers move to the next free port when theirs is taken, so the neighbours are candidates too.
const ports = [...new Set([
  ...(expected ? [0, 1, 2, 3, 4, 5].map((d) => expected.port + d) : []),
  ...(usual ? [0, 1, 2, 3].map((d) => usual + d) : []),
  3000, 3001, 4200, 4321, 5173, 5174, 8080, 8000, 5000, 1234,
])].filter((p) => p < 65536);

// ---- which local ports answer ----
const get = (host, port, pathname, ms = 900) =>
  new Promise((resolve) => {
    const req = http.get({ host, port, path: pathname, timeout: ms, headers: { accept: "text/html,*/*" } }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (c) => (body.length < 200_000 ? (body += c) : null));
      res.on("end", () => resolve({ status: res.statusCode, body, type: String(res.headers["content-type"] ?? "") }));
    });
    req.on("timeout", () => req.destroy());
    req.on("error", () => resolve(null));
  });
// A dev server may listen on IPv4, IPv6 or both; "localhost" follows whatever this machine prefers.
const HOSTS = ["localhost", "127.0.0.1", "::1"];
async function probe(port) {
  for (const host of HOSTS) {
    const page = await get(host, port, "/");
    if (page) return { host, port, page };
  }
  return null;
}

// ---- is what answers this project? ----
const titleOf = (html) => (/<title[^>]*>([^<]*)<\/title>/i.exec(html ?? "")?.[1] ?? "").trim();
const ownTitles = ["index.html", "src/index.html", "public/index.html"].map((f) => titleOf(read(f))).filter(Boolean);
// The folder the process listening on a port was started in, or its command line, when the system tells us.
function processOf(port) {
  try {
    if (process.platform === "win32") {
      // A listening socket is the row whose local address ends in the port and whose remote address
      // is all zeros; the state word is translated on non-English Windows, so it is not looked at.
      const table = execFileSync("netstat", ["-ano"], { encoding: "utf8", timeout: 4000 });
      const row = table.split("\n").map((l) => l.trim().split(/\s+/)).find((c) => c[0] === "TCP" && c[1]?.endsWith(`:${port}`) && /^(0\.0\.0\.0|\[::\]):0$/.test(c[2] ?? ""));
      const pid = row?.at(-1);
      if (!pid || !/^\d+$/.test(pid)) return null;
      const cmd = execFileSync("powershell", ["-NoProfile", "-NonInteractive", "-Command", `(Get-CimInstance Win32_Process -Filter "ProcessId=${pid}").CommandLine`], { encoding: "utf8", timeout: 6000 });
      return cmd.trim() || null;
    }
    const pid = execFileSync("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-t"], { encoding: "utf8", timeout: 4000 }).trim().split("\n")[0];
    if (!pid) return null;
    const cwd = execFileSync("lsof", ["-a", "-p", pid, "-d", "cwd", "-Fn"], { encoding: "utf8", timeout: 4000 });
    return /^n(.+)$/m.exec(cwd)?.[1] ?? null;
  } catch {
    return null;
  }
}
const same = (a, b) => fwd(a).toLowerCase().replace(/\/+$/, "") === fwd(b).toLowerCase().replace(/\/+$/, "");
const inside = (text) => fwd(String(text)).toLowerCase().includes(fwd(root).toLowerCase());

async function identify({ host, port, page }) {
  const url = `http://${host.includes(":") ? `[${host}]` : host}:${port}/`;
  const html = page.body ?? "";
  // A Vite-style dev server hands out the project's own files: its package.json settles it.
  const served = await get(host, port, "/package.json");
  if (served?.status === 200) {
    try {
      const theirs = JSON.parse(served.body);
      if (theirs.name && theirs.name === pkg.name && JSON.stringify(theirs.scripts ?? {}) === JSON.stringify(scripts)) return { url, port, match: "certain", why: "the server serves this project's package.json" };
      if (theirs.name && theirs.name !== pkg.name) return { url, port, match: "other", why: `serves another project (${theirs.name})` };
    } catch {
      // Not JSON: an app that answers every path with its page. Carry on.
    }
  }
  const proc = processOf(port);
  if (proc && (same(proc, root) || inside(proc))) return { url, port, match: "certain", why: "the process listening there was started in this project's folder" };
  if (proc && /[\\/]/.test(proc) && !inside(proc) && process.platform !== "win32") return { url, port, match: "other", why: "the process listening there belongs to another folder" };
  const title = titleOf(html);
  if (title && ownTitles.includes(title)) return { url, port, match: "likely", why: `the page title matches this project's ("${title}")` };
  if (expected?.port === port && /text\/html/.test(page.type)) return { url, port, match: "likely", why: `it answers on the port from ${expected.source}` };
  return { url, port, match: "unknown", why: /text\/html/.test(page.type) ? "a web page answers here, but nothing ties it to this project" : "something answers here that is not a web page" };
}

const found = (await Promise.all(ports.map(probe))).filter(Boolean);
const running = (await Promise.all(found.map(identify))).filter((r) => r.match !== "other");
const certain = running.filter((r) => r.match === "certain");
const likely = running.filter((r) => r.match === "likely");
const pick = certain.length === 1 ? certain[0] : !certain.length && likely.length === 1 ? likely[0] : null;
const manager = fs.existsSync(path.join(root, "pnpm-lock.yaml")) ? "pnpm" : fs.existsSync(path.join(root, "yarn.lock")) ? "yarn" : fs.existsSync(path.join(root, "bun.lockb")) || fs.existsSync(path.join(root, "bun.lock")) ? "bun" : "npm";
const start = scriptName ? { command: `${manager} run ${scriptName}`, script, port: expected?.port ?? null } : null;

out({
  project: fwd(root),
  expected,
  best: pick?.url ?? null,
  running,
  start: pick ? null : start,
  ask: !pick && (running.length > 0 || !start),
  message: pick
    ? `Open ${pick.url} (${pick.why}).`
    : certain.length > 1 || likely.length > 1
      ? "More than one running server could be this project. Ask the user which address to use."
      : running.length
        ? "Something is running on a usual port, but nothing ties it to this project. Ask the user whether it is the right one, or for the address."
        : start
          ? `No dev server is running. It can be started with "${start.command}"${start.port ? `, expected on port ${start.port}` : ""}; run this script again once it is up.`
          : "No dev server is running and the project has no dev script. Ask the user how to start it, or for the address.",
});
