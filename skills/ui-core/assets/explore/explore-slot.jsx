// @ts-nocheck
"use client";
// React adapter for the explore comparison. Temporary: copy it with the other explore files, delete afterwards.
// Wrap the component being explored:
//   export function ProductCard(props) {
//     return <ExploreSlot name="ProductCard" original={ProductCardCurrent} drafts={drafts} props={props} />;
//   }
// All behaviour (which draft shows where, the bar, the listener) lives in explore-core.js.
import { useLayoutEffect, useRef, useState } from "react";
import { attach } from "./explore-core.js";

export function ExploreSlot({ name, original: Original, drafts, props }) {
  const ref = useRef(null);
  const [key, setKey] = useState("current");
  const keys = Object.keys(drafts).join(",");

  useLayoutEffect(() => {
    const slot = attach(name, ref.current, keys ? keys.split(",") : [], setKey);
    return () => slot.detach();
  }, [name, keys]);

  const View = key === "current" ? Original : drafts[key] ?? Original;
  return (
    <div ref={ref} data-ui-explore={name}>
      <View {...props} />
    </div>
  );
}
