// @ts-nocheck
"use client";
// Temporary helper for the explore command. Copy it next to the component being explored; delete it afterwards.
// It renders a different draft in each sibling instance so alternatives can be compared in place:
// the first instance keeps the current design, the following ones show the drafts in order.
// Add ?explore=<key> to the URL to show one draft in every instance, or ?explore=current for the original.
import { useLayoutEffect, useRef, useState } from "react";

export function ExploreSlot({ name, original: Original, drafts, props }) {
  const ref = useRef(null);
  const [index, setIndex] = useState(0);

  useLayoutEffect(() => {
    const all = [...document.querySelectorAll(`[data-ui-explore="${name}"]`)];
    setIndex(Math.max(0, all.indexOf(ref.current)));
  }, [name]);

  const order = ["current", ...Object.keys(drafts)];
  const forced = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("explore");
  const key = forced && order.includes(forced) ? forced : order[index % order.length];
  const View = key === "current" ? Original : drafts[key];

  return (
    <div ref={ref} data-ui-explore={name} data-ui-explore-variant={key} style={{ position: "relative", display: "grid", minWidth: 0 }}>
      <span
        style={{
          position: "absolute", top: -10, left: 8, zIndex: 10, padding: "1px 8px", borderRadius: 999,
          font: "600 11px/16px system-ui, sans-serif", background: key === "current" ? "#334155" : "#be123c", color: "#fff", pointerEvents: "none",
        }}
      >
        {key}
      </span>
      <View {...props} />
    </div>
  );
}
