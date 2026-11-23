#!/usr/bin/env node
// ui-creator · Copyright (c) 2026 Murtaza Mehdi Yucal · MIT License · https://github.com/murtazayucal/ui-creator
// Carries clicks on the explore bar and dock from the browser to the agent, so the user does not have to type.
//
//   node explore-listen.mjs wait   --config <path to explore-config.js> [--timeout-min 120]
//   node explore-listen.mjs status --config <path>
//   node explore-listen.mjs stop   --config <path>
//
// Run `wait` as a background command. It prints one JSON line and exits when the user clicks something
// that needs the agent (apply, new variations, save, pick, library); that exit is the signal to act.
// Run `wait` again after handling it.
//
// Behind it runs a small server that `wait` starts by itself and that keeps running between waits and
// across sessions, so the bar never goes dead while the agent is busy and no click is lost: clicks are
// queued (for 15 minutes) until the next `wait`. The server picks a free port on its first start and
// writes it, with a random token, into the config file; the page reads both from there.
// The server only records which button was pressed. It reads and writes no project files except that
// config, listens on 127.0.0.1 only, refuses requests without the token, and exits after 12 idle hours.
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [mode, ...rest] = process.argv.slice(2);
const opt = (n, d) => (rest.includes(`--${n}`) ? rest[rest.indexOf(`--${n}`) + 1] : d);
const out = (x) => console.log(JSON.stringify(x));
const configPath = opt("config") ? path.resolve(opt("config")) : null;

if (!["wait", "status", "stop", "serve"].includes(mode) || !configPath) {
  out({ action: "error", detail: "usage: explore-listen.mjs wait|status|stop --config <path to explore-config.js>" });
  process.exit(0);
}

// ---- config file: port and token live there so the page and this script agree ----
function readConfig() {
  let text;
  try { text = fs.readFileSync(configPath, "utf8"); } catch { return null; }
  return {
    text,
    port: parseInt(text.match(/\bport\s*:\s*(\d+)/)?.[1] ?? "0", 10),
    token: text.match(/\btoken\s*:\s*["']([\w-]*)["']/)?.[1] ?? "",
  };
}
function writeConfig(cfg, port, token) {
  const text = cfg.text.replace(/\bport\s*:\s*\d+/, `port: ${port}`).replace(/\btoken\s*:\s*["'][\w-]*["']/, `token: "${token}"`);
  if (text !== cfg.text) fs.writeFileSync(configPath, text);
}
const freePort = (from) =>
  new Promise((resolve) => {
    const tryPort = (p) => {
      if (p > from + 200) return resolve(0);
      const s = net.createServer();
      s.once("error", () => tryPort(p + 1));
      s.once("listening", () => s.close(() => resolve(p)));
      s.listen(p, "127.0.0.1");
    };
    tryPort(from);
  });
const call = (port, pathAndQuery, { method = "GET", body, timeoutMs = 3000 } = {}) =>
  new Promise((resolve) => {
    const req = http.request({ host: "127.0.0.1", port, path: pathAndQuery, method, timeout: timeoutMs }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, json: JSON.parse(data) }); } catch { resolve({ status: res.statusCode, json: null }); }
      });
    });
    req.on("timeout", () => req.destroy());
    req.on("error", () => resolve(null));
    if (body) req.write(body);
    req.end();
  });
const alive = async (cfg) => !!cfg?.port && !!cfg.token && (await call(cfg.port, `/ping?token=${cfg.token}`))?.json?.ok === true;

// ======================= server =======================
if (mode === "serve") {
  const cfg = readConfig();
  const port = cfg.port;
  const token = cfg.token;
  const KEY = /^[\w-]{1,24}$/;
  const ACTIONS = ["apply", "more", "save", "pick", "library", "style", "cancel"];
  const clean = (s, max) => String(s ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
  const TTL = 15 * 60_000;
  const IDLE = 12 * 60 * 60_000;

  let queue = []; // { event, at }
  let removed = [];
  let waiter = null; // response object of the connected `wait`
  let lastSeen = Date.now();

  const fresh = () => (queue = queue.filter((q) => Date.now() - q.at < TTL));
  const deliver = () => {
    fresh();
    if (!waiter || !queue.length) return;
    const { event } = queue.shift();
    const res = waiter;
    waiter = null;
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ...event, removed }));
    removed = [];
  };

  const server = http.createServer((req, res) => {
    lastSeen = Date.now();
    const send = (code, body) => {
      res.writeHead(code, {
        "content-type": "application/json",
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, POST, OPTIONS",
        "access-control-allow-headers": "content-type",
        "cache-control": "no-store",
      });
      res.end(JSON.stringify(body));
    };
    const url = new URL(req.url, "http://127.0.0.1");
    if (req.method === "OPTIONS") return send(204, {});
    const authed = url.searchParams.get("token") === token;

    if (req.method === "GET" && url.pathname === "/ping") {
      fresh();
      return authed ? send(200, { ok: true, listening: !!waiter, queued: queue.length, removed }) : send(403, { ok: false });
    }
    // The agent's `wait` holds this request open until something is clicked.
    if (req.method === "GET" && url.pathname === "/next") {
      if (!authed) return send(403, { ok: false });
      if (waiter) {
        waiter.writeHead(200, { "content-type": "application/json" });
        waiter.end(JSON.stringify({ action: "replaced" }));
      }
      waiter = res;
      req.on("close", () => {
        if (waiter === res) waiter = null;
      });
      return deliver();
    }
    if (req.method === "POST" && url.pathname === "/shutdown") {
      if (!authed) return send(403, { ok: false });
      send(200, { ok: true });
      return setTimeout(() => process.exit(0), 50);
    }
    if (req.method !== "POST" || url.pathname !== "/signal") return send(404, { ok: false });

    let body = "";
    req.on("data", (c) => {
      body += c;
      if (body.length > 8192) req.destroy();
    });
    req.on("end", () => {
      let m;
      try { m = JSON.parse(body); } catch { return send(400, { ok: false, error: "not json" }); }
      if (m?.token !== token) return send(403, { ok: false });
      const { action, key, component } = m;
      if (action !== "remove" && !ACTIONS.includes(action)) return send(400, { ok: false, error: "unknown action" });
      if (!KEY.test(String(component ?? ""))) return send(400, { ok: false, error: "bad component" });
      if (["apply", "remove", "save"].includes(action) && !KEY.test(String(key ?? ""))) return send(400, { ok: false, error: "bad key" });

      if (action === "remove") {
        if (!removed.includes(key)) removed.push(key);
        return send(200, { ok: true });
      }
      const event = { action, component, at: new Date().toISOString() };
      if (action === "apply" || action === "save") event.key = key;
      // One bar serves every open comparison: targets lists the components this click is about and the
      // draft each one shows (null: several drafts spread over its instances).
      if (Array.isArray(m.targets)) {
        event.targets = m.targets.slice(0, 8).filter((x) => KEY.test(String(x?.component ?? ""))).map((x) => ({
          component: x.component,
          key: x.key == null ? null : KEY.test(String(x.key)) ? String(x.key) : null,
        }));
      }
      if (action === "more") event.note = clean(m.note, 200);
      const pickedOf = (p) => ({
        framework: ["react", "vue", "svelte", "angular"].includes(p.framework) ? p.framework : null,
        component: KEY.test(String(p.component ?? "")) ? p.component : null,
        file: clean(p.file, 200) || null,
        instances: Number.isInteger(p.instances) ? p.instances : null,
        tag: clean(p.tag, 20),
        text: clean(p.text, 80),
        classes: clean(p.classes, 160),
        // Components inside the picked element, and whether the user wants them restyled with it.
        ...(Array.isArray(p.parts) && p.parts.length
          ? {
              parts: p.parts.slice(0, 8).filter((x) => KEY.test(String(x?.component ?? ""))).map((x) => ({
                component: x.component,
                file: clean(x.file, 200) || null,
                instances: Number.isInteger(x.instances) ? x.instances : null,
                include: x.include !== false,
              })),
            }
          : {}),
      });
      if (action === "pick") {
        // From the dock menu: the whole page the user is on, not an element.
        if (m.scope === "page") {
          event.scope = "page";
          event.path = clean(m.path, 200);
        } else event.picked = pickedOf(m.picked ?? {});
      }
      if (action === "cancel" && m.scope === "all") event.scope = "all";
      if (action === "style") {
        // Ids from the style catalog; the agent looks them up, so anything that is not a plain id is dropped.
        event.styles = (Array.isArray(m.styles) ? m.styles : []).filter((s) => /^[a-z][a-z0-9-]{1,29}$/.test(String(s))).slice(0, 2);
        event.note = clean(m.note, 200);
        if (!event.styles.length && !event.note) return send(400, { ok: false, error: "no style" });
        if (m.scope === "page") event.scope = "page";
        else if (m.picked) event.picked = pickedOf(m.picked);
      }
      queue.push({ event, at: Date.now() });
      send(200, { ok: true, listening: !!waiter });
      deliver();
    });
  });
  server.on("error", () => process.exit(0));
  server.listen(port, "127.0.0.1");
  setInterval(() => {
    if (Date.now() - lastSeen > IDLE) process.exit(0);
  }, 60_000).unref();
} else {
  // ======================= client commands =======================
  let cfg = readConfig();
  if (!cfg) {
    out({ action: "error", detail: `cannot read ${configPath}` });
    process.exit(0);
  }

  if (mode === "status") {
    const up = await alive(cfg);
    const ping = up ? (await call(cfg.port, `/ping?token=${cfg.token}`)).json : null;
    out({ running: up, port: cfg.port || null, listening: ping?.listening ?? false, queued: ping?.queued ?? 0 });
    process.exit(0);
  }
  if (mode === "stop") {
    const up = await alive(cfg);
    if (up) await call(cfg.port, `/shutdown?token=${cfg.token}`, { method: "POST" });
    out({ stopped: up });
    process.exit(0);
  }

  // wait: make sure the server runs, then hold a request open until an event arrives.
  if (!(await alive(cfg))) {
    const port = await freePort(cfg.port && cfg.port > 1023 ? cfg.port : 5199);
    if (!port) {
      out({ action: "error", detail: "no free port found near 5199" });
      process.exit(0);
    }
    const token = /^[\w-]{16,64}$/.test(cfg.token) ? cfg.token : crypto.randomBytes(18).toString("hex");
    writeConfig(cfg, port, token);
    cfg = readConfig();
    const child = spawn(process.execPath, [fileURLToPath(import.meta.url), "serve", "--config", configPath], { detached: true, stdio: "ignore", windowsHide: true });
    child.unref();
    let up = false;
    for (let i = 0; i < 40 && !up; i++) {
      await new Promise((r) => setTimeout(r, 150));
      up = await alive(cfg);
    }
    if (!up) {
      out({ action: "error", detail: "the listener server did not start" });
      process.exit(0);
    }
  }

  const minutes = Math.min(720, Math.max(1, parseFloat(opt("timeout-min", "120")) || 120));
  const deadline = Date.now() + minutes * 60_000;
  for (;;) {
    const left = deadline - Date.now();
    if (left <= 0) {
      out({ action: "timeout", port: cfg.port });
      process.exit(0);
    }
    const res = await call(cfg.port, `/next?token=${cfg.token}`, { timeoutMs: Math.min(left, 10 * 60_000) });
    if (res?.json?.action) {
      out({ ...res.json, port: cfg.port });
      process.exit(0);
    }
    if (!res && !(await alive(cfg))) {
      out({ action: "error", detail: "the listener server stopped" });
      process.exit(0);
    }
    // A long poll that timed out: ask again.
  }
}
