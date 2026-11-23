#!/usr/bin/env node
// Waits for a click on the explore bar in the browser and reports it, so the user does not have to type.
//   node explore-listen.mjs --port 5199 --token <secret> [--out <file>] [--timeout-min 120]
// Run it in the background. It prints one JSON line and exits when the user clicks Apply, More or Cancel
// in the bar, or picks another element; that exit is the signal to act. "Remove" clicks are collected and
// reported with it. A "more" signal may carry a short note; a "pick" signal carries what was clicked.
// It only records which button was pressed for which draft. It reads and writes no project files and
// listens on 127.0.0.1 only; requests without the token are refused.
import http from "node:http";
import fs from "node:fs";

const argv = process.argv.slice(2);
const opt = (n, d) => (argv.includes(`--${n}`) ? argv[argv.indexOf(`--${n}`) + 1] : d);
const port = parseInt(opt("port", "5199"), 10);
const token = opt("token", "");
const outFile = opt("out", null);
const timeoutMin = Math.min(720, Math.max(1, parseFloat(opt("timeout-min", "120")) || 120));

if (!/^[\w-]{8,64}$/.test(token)) {
  console.log(JSON.stringify({ action: "error", detail: "pass --token with 8-64 letters, digits, - or _" }));
  process.exit(0);
}

const KEY = /^[\w-]{1,24}$/;
const ENDING = new Set(["apply", "more", "cancel", "pick"]);
// Free text from the page is cut short and stripped of control characters before it is reported.
const clean = (s, max) => String(s ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const removed = [];

function finish(result) {
  const line = JSON.stringify({ ...result, removed, at: new Date().toISOString() });
  if (outFile) {
    try { fs.writeFileSync(outFile, line + "\n"); } catch {}
  }
  console.log(line);
  server.close();
  setTimeout(() => process.exit(0), 50);
}

const server = http.createServer((req, res) => {
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
  if (req.method === "GET" && url.pathname === "/ping") {
    return url.searchParams.get("token") === token ? send(200, { ok: true, removed }) : send(403, { ok: false });
  }
  if (req.method !== "POST" || url.pathname !== "/signal") return send(404, { ok: false });

  let body = "";
  req.on("data", (c) => {
    body += c;
    if (body.length > 4096) req.destroy();
  });
  req.on("end", () => {
    let m;
    try { m = JSON.parse(body); } catch { return send(400, { ok: false, error: "not json" }); }
    if (m?.token !== token) return send(403, { ok: false });
    const { action, key, component } = m;
    if (!["apply", "more", "cancel", "remove", "pick"].includes(action)) return send(400, { ok: false, error: "unknown action" });
    if (!KEY.test(String(component ?? ""))) return send(400, { ok: false, error: "bad component" });
    if ((action === "apply" || action === "remove") && !KEY.test(String(key ?? ""))) return send(400, { ok: false, error: "bad key" });

    if (action === "remove") {
      if (!removed.includes(key)) removed.push(key);
      return send(200, { ok: true, removed });
    }
    send(200, { ok: true });
    const extra = {};
    if (action === "apply") extra.key = key;
    if (action === "more") extra.note = clean(m.note, 200);
    if (action === "pick") {
      const p = m.picked ?? {};
      extra.picked = {
        component: KEY.test(String(p.component ?? "")) ? p.component : null,
        instances: Number.isInteger(p.instances) ? p.instances : null,
        tag: clean(p.tag, 20),
        text: clean(p.text, 80),
        classes: clean(p.classes, 160),
      };
    }
    if (ENDING.has(action)) finish({ action, component, ...extra });
  });
});

server.on("error", (e) => {
  console.log(JSON.stringify({ action: "error", detail: e.code === "EADDRINUSE" ? `port ${port} is in use; pick another` : e.message }));
  process.exit(0);
});
server.listen(port, "127.0.0.1", () => {
  setTimeout(() => finish({ action: "timeout" }), timeoutMin * 60_000).unref?.();
});
