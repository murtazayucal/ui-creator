// ui-creator · Copyright (c) 2026 Murtaza Mehdi Yucal · MIT License · https://github.com/murtazayucal/ui-creator
// The "Style" window of the explore bar and dock: tiles that preview design languages, a field for the
// user's own words, and a button that sends the choice to the agent. Plain JavaScript and DOM only.
// The tiles are drawn here with fixed colors so they look the same in every project; the drafts the agent
// writes use the project's own tokens. Ids match skills/ui-core/data/styles.json.
import { exploreConfig } from "./explore-config.js";
import { icon, UI } from "./explore-pick.js";

const T = {
  style: "Style",
  styleTitle: "Choose a design language",
  styleHint: "Pick one, or two to mix",
  styleNote: "or describe it in your own words",
  styleGo: "Generate drafts",
  styleElement: "Pick an element",
  stylePage: "This page",
  styleCare: "needs contrast care",
  close: "Close",
  ...exploreConfig.labels,
};
export const styleLabel = T.style;

const FONT = "system-ui, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const SERIF = "Georgia, 'Times New Roman', serif";

// Each tile: the scene behind the sample, the sample card, its title, its text line and its button.
const STYLES = [
  { id: "glass", name: "Glassmorphism", care: true,
    scene: { background: "linear-gradient(135deg, #6366f1 0%, #ec4899 55%, #f59e0b 100%)" },
    card: { background: "rgb(255 255 255 / 0.2)", border: "1px solid rgb(255 255 255 / 0.45)", borderRadius: "16px", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", boxShadow: "0 8px 24px rgb(0 0 0 / 0.18)" },
    title: { color: "#fff" }, text: { background: "rgb(255 255 255 / 0.6)" },
    btn: { background: "rgb(255 255 255 / 0.9)", color: "#3730a3", borderRadius: "999px" } },
  { id: "neumorph", name: "Neumorphism", care: true,
    scene: { background: "#e4e8ee" },
    card: { background: "#e4e8ee", borderRadius: "18px", boxShadow: "6px 6px 12px #c3c8d0, -6px -6px 12px #ffffff" },
    title: { color: "#334155" }, text: { background: "#b6bdc8" },
    btn: { background: "#e4e8ee", color: "#334155", borderRadius: "999px", boxShadow: "3px 3px 6px #c3c8d0, -3px -3px 6px #ffffff" } },
  { id: "clay", name: "Claymorphism",
    scene: { background: "#fde7f0" },
    card: { background: "#c7d2fe", borderRadius: "26px", boxShadow: "0 12px 20px rgb(99 102 241 / 0.3), inset 4px 4px 8px rgb(255 255 255 / 0.7), inset -5px -5px 10px rgb(79 70 229 / 0.25)" },
    title: { color: "#312e81", fontWeight: "800" }, text: { background: "rgb(49 46 129 / 0.35)" },
    btn: { background: "#fb7185", color: "#4c0519", borderRadius: "999px", boxShadow: "inset 2px 2px 4px rgb(255 255 255 / 0.6), inset -2px -2px 4px rgb(159 18 57 / 0.3)" } },
  { id: "brutalist", name: "Neo-brutalism",
    scene: { background: "#fde047" },
    card: { background: "#fff", border: "3px solid #000", borderRadius: "0", boxShadow: "5px 5px 0 #000" },
    title: { color: "#000", fontWeight: "900", textTransform: "uppercase" }, text: { background: "#000" },
    btn: { background: "#22d3ee", color: "#000", border: "2px solid #000", borderRadius: "0", boxShadow: "2px 2px 0 #000" } },
  { id: "minimal", name: "Minimal / flat",
    scene: { background: "#ffffff" },
    card: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "6px" },
    title: { color: "#0f172a", fontWeight: "600" }, text: { background: "#cbd5e1" },
    btn: { background: "#0f172a", color: "#fff", borderRadius: "6px" } },
  { id: "material", name: "Material",
    scene: { background: "#eef2f7" },
    card: { background: "#fff", borderRadius: "12px", boxShadow: "0 1px 3px rgb(0 0 0 / 0.2), 0 4px 8px rgb(0 0 0 / 0.12)" },
    title: { color: "#1e293b" }, text: { background: "#cbd5e1" },
    btn: { background: "#2563eb", color: "#fff", borderRadius: "999px", boxShadow: "0 1px 3px rgb(0 0 0 / 0.3)" } },
  { id: "bento", name: "Bento grid", bento: true,
    scene: { background: "#f1f5f9" },
    card: { background: "#fff", borderRadius: "14px" },
    title: { color: "#0f172a", fontWeight: "700" }, text: { background: "#cbd5e1" },
    btn: { background: "#0f172a", color: "#fff", borderRadius: "10px" } },
  { id: "editorial", name: "Editorial",
    scene: { background: "#faf7f2" },
    card: { background: "transparent", borderTop: "2px solid #1c1917", borderBottom: "1px solid #a8a29e", borderRadius: "0" },
    title: { color: "#1c1917", fontFamily: SERIF, fontWeight: "700", fontSize: "15px" }, text: { background: "#a8a29e" },
    btn: { background: "transparent", color: "#1c1917", borderRadius: "0", borderBottom: "1px solid #1c1917", padding: "0 0 1px", fontFamily: SERIF, fontStyle: "italic" } },
  { id: "neon", name: "Dark neon", care: true,
    scene: { background: "#070b14" },
    card: { background: "#0f172a", border: "1px solid rgb(34 211 238 / 0.55)", borderRadius: "12px", boxShadow: "0 0 18px rgb(34 211 238 / 0.35)" },
    title: { color: "#67e8f9" }, text: { background: "#334155" },
    btn: { background: "transparent", color: "#f0abfc", border: "1px solid #e879f9", borderRadius: "8px", boxShadow: "0 0 10px rgb(232 121 249 / 0.5)" } },
  { id: "pastel", name: "Soft pastel",
    scene: { background: "#f5f3ff" },
    card: { background: "#dcfce7", borderRadius: "20px", boxShadow: "0 8px 18px rgb(34 197 94 / 0.18)" },
    title: { color: "#14532d" }, text: { background: "rgb(20 83 45 / 0.3)" },
    btn: { background: "#fed7aa", color: "#7c2d12", borderRadius: "999px" } },
  { id: "corporate", name: "Corporate clean",
    scene: { background: "#f3f4f6" },
    card: { background: "#fff", border: "1px solid #d1d5db", borderTop: "4px solid #1d4ed8", borderRadius: "6px", boxShadow: "0 1px 2px rgb(0 0 0 / 0.06)" },
    title: { color: "#111827", fontWeight: "600" }, text: { background: "#d1d5db" },
    btn: { background: "#1d4ed8", color: "#fff", borderRadius: "4px" } },
  { id: "terminal", name: "Terminal / mono",
    scene: { background: "#0c0c0c" },
    card: { background: "transparent", border: "1px dashed #a3e635", borderRadius: "0" },
    title: { color: "#d9f99d", fontFamily: MONO, fontWeight: "500" }, text: { background: "#4d7c0f" },
    btn: { background: "#a3e635", color: "#0c0c0c", borderRadius: "0", fontFamily: MONO } },
];

function make(tag, style, attrs = {}) {
  const el = document.createElement(tag);
  Object.assign(el.style, style);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function sample(s) {
  const scene = make("div", { height: "116px", display: "grid", placeItems: "center", padding: "12px", borderRadius: "10px 10px 0 0", overflow: "hidden", ...s.scene });
  const body = (extra = {}) => {
    const card = make("div", { boxSizing: "border-box", width: "100%", padding: "10px 12px", display: "grid", gap: "6px", ...s.card, ...extra });
    const title = make("div", { font: `700 13px/16px ${FONT}`, ...s.title });
    title.textContent = "Aa Title";
    const line = make("div", { height: "5px", width: "70%", borderRadius: "3px", ...s.text });
    const btn = make("div", { justifySelf: "start", marginTop: "2px", padding: "3px 10px", font: `600 10px/14px ${FONT}`, ...s.btn });
    btn.textContent = "Button";
    card.append(title, line, btn);
    return card;
  };
  if (s.bento) {
    // A layout more than a surface: show tiles of different sizes locked into one grid.
    const grid = make("div", { width: "100%", height: "100%", display: "grid", gridTemplateColumns: "1.5fr 1fr", gridTemplateRows: "1fr 1fr", gap: "6px" });
    const big = body({ gridRow: "1 / 3", alignContent: "center" });
    grid.append(big, make("div", { borderRadius: "14px", background: "#fb923c" }), make("div", { borderRadius: "14px", background: "#0f172a" }));
    scene.append(grid);
  } else {
    scene.append(body());
  }
  return scene;
}

/**
 * Opens the window.
 * @param opts.scopes    true in the dock: the user also says what to restyle (an element they pick, or this page)
 * @param opts.onChoose  called with { styles: string[], note: string, scope: "component" | "pick" | "page" }
 */
export function openStylePicker({ scopes = false, onChoose }) {
  document.querySelector("[data-ui-explore-styles]")?.remove();
  const chosen = [];
  const back = make("div", { position: "fixed", inset: "0", zIndex: "2147483200", display: "grid", placeItems: "center", padding: "16px", background: "rgb(12 12 14 / 0.7)", font: `400 14px/20px ${FONT}` }, { "data-ui-explore-styles": "" });
  const box = make("div", { boxSizing: "border-box", width: "min(860px, 100%)", maxHeight: "calc(100vh - 32px)", display: "flex", flexDirection: "column", borderRadius: "14px", background: UI.bg, color: UI.text, border: `1px solid ${UI.line}`, boxShadow: UI.shadow }, { role: "dialog", "aria-modal": "true", "aria-label": T.styleTitle });

  const head = make("div", { display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px 10px" });
  const h = make("div", { flex: "1" });
  const title = make("div", { font: `700 16px/22px ${FONT}`, color: "#fff" });
  title.textContent = T.styleTitle;
  const hint = make("div", { font: `400 13px/18px ${FONT}`, color: UI.muted });
  hint.textContent = T.styleHint;
  h.append(title, hint);
  const close = make("button", { border: `1px solid ${UI.line}`, cursor: "pointer", borderRadius: "8px", padding: "6px 12px", font: `600 13px/18px ${FONT}`, background: "transparent", color: UI.text }, { type: "button", "data-ui-explore-action": "style-close" });
  close.textContent = T.close;
  head.append(h, close);

  const grid = make("div", { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px", padding: "6px 16px 14px", overflowY: "auto" });
  const tiles = STYLES.map((s) => {
    const tile = make("button", { display: "block", padding: "0", textAlign: "left", cursor: "pointer", position: "relative", borderRadius: "10px", border: `2px solid ${UI.line}`, background: UI.raised, color: UI.text, font: "inherit", outlineOffset: "2px" }, { type: "button", "aria-pressed": "false", "data-ui-explore-style": s.id });
    const cap = make("div", { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", padding: "8px 10px", font: `600 13px/18px ${FONT}` });
    const name = make("span", {});
    name.textContent = s.name;
    cap.append(name);
    if (s.care) {
      const care = make("span", { font: `500 11px/14px ${FONT}`, color: UI.warn, textAlign: "right" });
      care.textContent = T.styleCare;
      cap.append(care);
    }
    const mark = make("span", { position: "absolute", top: "8px", right: "8px", display: "none", minWidth: "22px", height: "22px", boxSizing: "border-box", padding: "0 6px", placeItems: "center", borderRadius: "6px", background: UI.accent, color: UI.onAccent, font: `700 12px/22px ${UI.mono}`, textAlign: "center" });
    tile.append(sample(s), cap, mark);
    tile.addEventListener("click", () => {
      const i = chosen.indexOf(s.id);
      if (i >= 0) chosen.splice(i, 1);
      else {
        chosen.push(s.id);
        if (chosen.length > 2) chosen.shift(); // a mix is two at most: the oldest choice gives way
      }
      sync();
    });
    grid.append(tile);
    return { id: s.id, tile, cap, mark };
  });

  const foot = make("form", { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", margin: "0", padding: "12px 16px 16px", borderTop: `1px solid ${UI.line}` });
  const note = make("input", { flex: "1 1 240px", minWidth: "0", height: "36px", padding: "0 14px", borderRadius: "8px", border: `1px solid ${UI.line}`, background: UI.raised, color: UI.text, font: `400 14px/20px ${FONT}` }, { "aria-label": T.styleNote, placeholder: T.styleNote, maxlength: "200", "data-ui-explore-action": "style-note" });
  const go = (label, scope, primary) => {
    const b = make("button", { border: primary ? "0" : `1px solid ${UI.line}`, cursor: "pointer", borderRadius: "8px", height: "36px", padding: "0 16px", font: `600 14px/20px ${FONT}`, whiteSpace: "nowrap", background: primary ? UI.accent : "transparent", color: primary ? UI.onAccent : UI.text }, { type: primary ? "submit" : "button", "data-ui-explore-action": `style-${scope}` });
    b.textContent = label;
    if (!primary) b.addEventListener("click", () => submit(scope));
    return b;
  };
  const buttons = scopes ? [go(T.stylePage, "page", false), go(T.styleElement, "pick", true)] : [go(T.styleGo, "component", true)];
  foot.append(note, ...buttons);

  const shut = () => {
    document.removeEventListener("keydown", onKey, true);
    back.remove();
  };
  function submit(scope) {
    const text = note.value.trim();
    if (!chosen.length && !text) return note.focus();
    shut();
    onChoose({ styles: [...chosen], note: text, scope });
  }
  function sync() {
    const ready = chosen.length > 0 || note.value.trim().length > 0;
    for (const t of tiles) {
      const n = chosen.indexOf(t.id);
      t.tile.setAttribute("aria-pressed", String(n >= 0));
      t.tile.style.borderColor = n >= 0 ? UI.accent : UI.line;
      t.mark.style.display = n >= 0 ? "block" : "none";
      // With two chosen, the numbers say which is the base (1) and which is borrowed from (2).
      t.mark.replaceChildren(chosen.length > 1 ? String(n + 1) : icon("check"));
      if (chosen.length < 2) t.mark.style.padding = "3px";
      else t.mark.style.padding = "0 6px";
    }
    for (const b of buttons) {
      b.disabled = !ready;
      b.style.opacity = ready ? "1" : "0.5";
      b.style.cursor = ready ? "pointer" : "not-allowed";
    }
  }
  function onKey(e) {
    if (e.key === "Escape") {
      e.stopPropagation();
      shut();
    }
  }

  foot.addEventListener("submit", (e) => {
    e.preventDefault();
    submit(scopes ? "pick" : "component");
  });
  note.addEventListener("input", sync);
  close.addEventListener("click", shut);
  back.addEventListener("click", (e) => e.target === back && shut());
  document.addEventListener("keydown", onKey, true);

  box.append(head, grid, foot);
  back.append(box);
  document.body.append(back);
  sync();
  tiles[0].tile.focus();
  return shut;
}
