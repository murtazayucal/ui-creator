// ui-creator · Copyright (c) 2026 Murtaza Mehdi Yucal · MIT License · https://github.com/murtazayucal/ui-creator
// @ts-nocheck
"use client";
// React adapter for the explore comparison. Temporary: copy it with the other explore files, delete afterwards.
// Wrap the component being explored:
//   export function ProductCard(props) {
//     return <ExploreSlot name="ProductCard" original={ProductCardCurrent} drafts={drafts} props={props} />;
//   }
// Written as a class with createElement so it does not depend on hooks or on a JSX runtime:
// it runs on every React version that has ES class components, with either JSX transform.
// All behaviour (which draft shows where, the bar, the listener) lives in explore-core.js.
// Not named React: some projects inject `import React` into every file, and a second one would clash.
import * as ReactLib from "react";
import { attach } from "./explore-core.js";

const keysOf = (drafts) => Object.keys(drafts || {});

class ExploreSlotInner extends ReactLib.Component {
  constructor(props) {
    super(props);
    this.state = { key: "current" };
    this.el = null;
    this.slot = null;
    this.setEl = (el) => {
      this.el = el;
    };
  }

  componentDidMount() {
    this.connect();
  }

  componentDidUpdate(prev) {
    if (prev.name !== this.props.name) {
      this.disconnect();
      this.connect();
    } else if (this.slot && keysOf(prev.drafts).join(",") !== keysOf(this.props.drafts).join(",")) {
      this.slot.setKeys(keysOf(this.props.drafts));
    }
  }

  componentWillUnmount() {
    this.disconnect();
  }

  connect() {
    if (!this.el) return;
    this.slot = attach(this.props.name, this.el, keysOf(this.props.drafts), (key) => this.setState({ key }));
  }

  disconnect() {
    if (this.slot) this.slot.detach();
    this.slot = null;
  }

  render() {
    const { name, original, drafts, props } = this.props;
    const View = this.state.key === "current" ? original : (drafts && drafts[this.state.key]) || original;
    return ReactLib.createElement("div", { ref: this.setEl, "data-ui-explore": name }, ReactLib.createElement(View, props));
  }
}

// Exported as a plain function with an untyped parameter: in a TypeScript project the wrapper you write
// around your component then type-checks without this file needing any type annotations.
export function ExploreSlot(props) {
  return ReactLib.createElement(ExploreSlotInner, props);
}
