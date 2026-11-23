// Temporary "design mode" dock for the explore command: a small floating control in the bottom-left corner
// that is there even when no comparison is open. Import it once from the app's entry file while design mode
// is on, and remove that import afterwards:
//   import "./__explore__/explore-dock.js";
// Plain JavaScript, so it works with any framework. It needs the listener to be running; without it the
// dock says so and does nothing else.
import { exploreConfig } from "./explore-config.js";
import { inFrame, ping, signal, startPicking } from "./explore-pick.js";

const L = exploreConfig.labels;

function mount() {
  document.querySelector("[data-ui-explore-dock]")?.remove();
  const dock = document.createElement("div");
  dock.setAttribute("data-ui-explore-dock", "");
  Object.assign(dock.style, {
    position: "fixed", left: "16px", bottom: "16px", zIndex: "2147483000", display: "flex", alignItems: "center", gap: "2px",
    padding: "4px", borderRadius: "999px", background: "#0f172a", boxShadow: "0 8px 24px rgb(0 0 0 / 0.3)", font: "600 13px/18px system-ui, sans-serif",
  });

  const button = (name) => {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("data-ui-explore-action", name);
    Object.assign(b.style, { border: "0", cursor: "pointer", borderRadius: "999px", padding: "6px 14px", font: "inherit", whiteSpace: "nowrap", background: "#334155", color: "#fff" });
    return b;
  };
  const pick = button("pick");
  const library = button("library");
  const status = document.createElement("span");
  Object.assign(status.style, { padding: "0 12px", font: "500 12px/18px system-ui, sans-serif", color: "#94a3b8", display: "none" });
  dock.append(pick, library, status);
  document.body.append(dock);

  let live = false;
  let sent = false;
  let stopPick = null;

  const render = () => {
    const on = live && !sent;
    pick.style.display = library.style.display = on ? "" : "none";
    status.style.display = on ? "none" : "";
    status.style.color = sent ? "#fde68a" : "#94a3b8";
    status.textContent = sent ? L.sent : L.offline;
    pick.textContent = stopPick ? L.picking : L.pick;
    pick.style.background = stopPick ? "#e11d48" : "#334155";
    library.textContent = L.library;
  };
  const send = (body) =>
    signal({ component: "dock", ...body })
      .then((ok) => {
        sent = ok;
        render();
      })
      .catch(() => {
        live = false;
        render();
      });

  pick.addEventListener("click", () => {
    if (stopPick) {
      stopPick();
      stopPick = null;
      return render();
    }
    stopPick = startPicking(
      (picked) => {
        stopPick = null;
        send({ action: "pick", picked });
      },
      () => {
        stopPick = null;
        render();
      }
    );
    render();
  });
  library.addEventListener("click", () => send({ action: "library" }));

  const check = () =>
    ping().then((ok) => {
      // A listener that is reachable again means the last request was handled and a new one can be sent.
      if (ok && !live) sent = false;
      live = ok;
      render();
    });
  check();
  const timer = setInterval(check, 4000);
  render();
  return () => {
    clearInterval(timer);
    stopPick?.();
    dock.remove();
  };
}

if (typeof window !== "undefined" && !inFrame) {
  window.__uiExploreDockOff?.();
  window.__uiExploreDockOff = mount();
}
