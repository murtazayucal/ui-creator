// @ts-nocheck
"use client";
// Temporary helper for the explore command. Copy it, with explore-config.js, next to the component being
// explored; delete both afterwards.
// It renders a different draft in each sibling instance so alternatives can be compared in place:
// the first instance keeps the current design, the following ones show the drafts in order.
// A bar at the bottom of the page switches every instance to one draft (with a single instance that is
// the only way to compare) and opens a phone-width preview. When a listener is configured the bar can
// also remove a draft, ask for new variations with a short note, save the shown draft to the user's personal
// library, apply it (two clicks) and pick another element on the page, all without the user typing in chat.
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { exploreConfig } from "./explore-config.js";
import { inFrame, ping as pingListener, signal, startPicking } from "./explore-pick.js";

const { port, labels: L } = exploreConfig;

const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const readForced = () => (typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("explore"));
function choose(key) {
  const url = new URL(window.location.href);
  if (key) url.searchParams.set("explore", key);
  else url.searchParams.delete("explore");
  window.history.replaceState(null, "", url);
  emit();
}

// Drafts the user removed from the bar; kept across reloads until the session is cleaned up.
const hiddenKey = (name) => `ui-explore-hidden:${name}`;
const hiddenCache = {};
const readHidden = (name) => {
  if (typeof window === "undefined") return "";
  return (hiddenCache[name] ??= window.localStorage.getItem(hiddenKey(name)) ?? "");
};
function hide(name, key) {
  const next = [...new Set([...readHidden(name).split(",").filter(Boolean), key])].join(",");
  window.localStorage.setItem(hiddenKey(name), next);
  hiddenCache[name] = next;
  emit();
}

// Several components can be explored at once; their bars stack upwards in the order they mounted.
let bars = [];
const readBars = () => bars.join(",");

// ---- styles ----
const font = "system-ui, sans-serif";
const base = { border: 0, cursor: "pointer", borderRadius: 999, font: `600 13px/18px ${font}`, padding: "6px 14px", whiteSpace: "nowrap" };
const pill = (active) => ({ ...base, background: active ? "#be123c" : "transparent", color: active ? "#fff" : "#e2e8f0" });
const action = (bg, color = "#fff") => ({ ...base, background: bg, color });
const divider = { width: 1, alignSelf: "stretch", margin: "4px 6px", background: "#334155" };
const hint = (color) => ({ padding: "0 12px", font: `500 12px/18px ${font}`, color });

function Preview({ shown, onClose }) {
  const url = new URL(window.location.href);
  url.searchParams.set("ui-explore-frame", "1");
  if (shown) url.searchParams.set("explore", shown);
  return (
    <div
      data-ui-explore-preview=""
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 2147482000, display: "grid", placeItems: "center", background: "rgb(15 23 42 / 0.6)" }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ display: "grid", gap: 8, justifyItems: "end" }}>
        <button type="button" style={action("#0f172a")} onClick={onClose}>
          {L.close}
        </button>
        <iframe
          title="375px"
          src={url.toString()}
          style={{ boxSizing: "content-box", width: 375, height: "min(760px, calc(100vh - 150px))", border: "8px solid #0f172a", borderRadius: 28, background: "#fff" }}
        />
      </div>
    </div>
  );
}

function Bar({ name, order, shown, mixed, single }) {
  const [live, setLive] = useState(false);
  const [armed, setArmed] = useState(false);
  const [sent, setSent] = useState(false);
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState(false);
  const [picking, setPicking] = useState(false);
  const stopPick = useRef(null);
  const slot = useSyncExternalStore(subscribe, readBars, () => "").split(",").indexOf(name);

  useEffect(() => {
    bars = [...bars.filter((b) => b !== name), name];
    emit();
    return () => {
      bars = bars.filter((b) => b !== name);
      emit();
      stopPick.current?.();
    };
  }, [name]);

  useEffect(() => {
    if (!port) return;
    let stop = false;
    let was = false;
    const ping = () =>
      pingListener().then((ok) => {
        if (stop) return;
        if (ok && !was) setSent(false);
        was = ok;
        setLive(ok);
      });
    ping();
    const id = setInterval(ping, 4000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, []);
  // The second click must come within a few seconds and on the same draft.
  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(id);
  }, [armed]);
  useEffect(() => setArmed(false), [shown]);

  const send = (body) => signal({ component: name, ...body }).then((ok) => ok && setSent(true)).catch(() => setLive(false));
  const isDraft = shown !== "current" && !mixed;
  const pick = () => {
    if (picking) {
      stopPick.current?.();
      return setPicking(false);
    }
    setPicking(true);
    stopPick.current = startPicking(
      (picked) => {
        setPicking(false);
        send({ action: "pick", picked });
      },
      () => setPicking(false)
    );
  };

  return (
    <>
      {preview && <Preview shown={mixed ? null : shown} onClose={() => setPreview(false)} />}
      <div
        data-ui-explore-bar={name}
        style={{
          position: "fixed", left: "50%", bottom: 16 + Math.max(0, slot) * 56, transform: "translateX(-50%)", zIndex: 2147483000,
          maxWidth: "calc(100vw - 24px)", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 2,
          padding: 4, borderRadius: 24, background: "#0f172a", boxShadow: "0 8px 24px rgb(0 0 0 / 0.3)",
        }}
      >
        <span style={hint("#94a3b8")}>{name}</span>
        {!single && (
          <button type="button" style={pill(mixed)} onClick={() => choose(null)}>
            {L.mixed}
          </button>
        )}
        {order.map((k) => (
          <button key={k} type="button" data-ui-explore-key={k} style={pill(!mixed && shown === k)} onClick={() => choose(k)}>
            {k === "current" ? L.current : k}
          </button>
        ))}
        <span style={divider} />
        <button type="button" data-ui-explore-action="preview" style={action("#1e293b")} onClick={() => setPreview(true)}>
          {L.mobile}
        </button>
        {port > 0 && <span style={divider} />}
        {port > 0 && sent && <span style={hint("#fde68a")}>{L.sent}</span>}
        {port > 0 && !sent && !live && <span style={hint("#94a3b8")}>{L.offline}</span>}
        {port > 0 && !sent && live && (
          <>
            {isDraft && (
              <button
                type="button"
                data-ui-explore-action="remove"
                style={action("transparent", "#fca5a5")}
                onClick={() => {
                  const i = order.indexOf(shown);
                  signal({ component: name, action: "remove", key: shown }).catch(() => setLive(false));
                  hide(name, shown);
                  choose(order[i + 1] ?? order[i - 1] ?? "current");
                }}
              >
                {L.remove} {shown}
              </button>
            )}
            <form
              style={{ display: "flex", alignItems: "center", gap: 2, margin: 0 }}
              onSubmit={(e) => {
                e.preventDefault();
                send({ action: "more", note });
              }}
            >
              <input
                data-ui-explore-action="note"
                aria-label={L.note}
                placeholder={L.note}
                value={note}
                maxLength={200}
                onChange={(e) => setNote(e.target.value)}
                style={{ width: 170, height: 30, padding: "0 12px", borderRadius: 999, border: "1px solid #475569", background: "#1e293b", color: "#fff", font: `400 13px/18px ${font}`, outline: "none" }}
              />
              <button type="submit" data-ui-explore-action="more" style={action("#334155")}>
                {L.more}
              </button>
            </form>
            <button type="button" data-ui-explore-action="pick" style={action(picking ? "#e11d48" : "#334155")} onClick={pick}>
              {picking ? L.picking : L.pick}
            </button>
            {isDraft && (
              <button type="button" data-ui-explore-action="save" style={action("#334155")} onClick={() => send({ action: "save", key: shown })}>
                {L.save} {shown}
              </button>
            )}
            {isDraft && (
              <button
                type="button"
                data-ui-explore-action="apply"
                style={action(armed ? "#f59e0b" : "#16a34a", armed ? "#0f172a" : "#fff")}
                onClick={() => (armed ? send({ action: "apply", key: shown }) : setArmed(true))}
              >
                {armed ? L.confirm : `${L.apply} ${shown}`}
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
}

export function ExploreSlot({ name, original: Original, drafts, props }) {
  const ref = useRef(null);
  const [place, setPlace] = useState({ index: 0, count: 1 });
  const forced = useSyncExternalStore(subscribe, readForced, () => null);
  const hidden = useSyncExternalStore(subscribe, () => readHidden(name), () => "");

  useLayoutEffect(() => {
    const all = [...document.querySelectorAll(`[data-ui-explore="${name}"]`)];
    setPlace({ index: Math.max(0, all.indexOf(ref.current)), count: all.length });
  }, [name]);

  const gone = hidden.split(",").filter(Boolean);
  const order = ["current", ...Object.keys(drafts).filter((k) => !gone.includes(k))];
  const single = place.count < 2;
  const mixed = !single && !(forced && order.includes(forced));
  // With one instance there is nothing to spread the drafts over, so start on the first draft.
  const key = forced && order.includes(forced) ? forced : single ? order[1] ?? "current" : order[place.index % order.length];
  const View = key === "current" ? Original : drafts[key];

  return (
    <div ref={ref} data-ui-explore={name} data-ui-explore-variant={key} style={{ position: "relative", display: "grid", minWidth: 0 }}>
      {!inFrame && (
        <span
          style={{
            position: "absolute", top: -10, left: 8, zIndex: 10, padding: "1px 8px", borderRadius: 999,
            font: `600 11px/16px ${font}`, background: key === "current" ? "#334155" : "#be123c", color: "#fff", pointerEvents: "none",
          }}
        >
          {key === "current" ? L.current : key}
        </span>
      )}
      <View {...props} />
      {place.index === 0 && !inFrame && <Bar name={name} order={order} shown={key} mixed={mixed} single={single} />}
    </div>
  );
}
