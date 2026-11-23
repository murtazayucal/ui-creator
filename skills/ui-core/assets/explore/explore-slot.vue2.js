// ui-creator · Copyright (c) 2026 Murtaza Mehdi Yucal · MIT License · https://github.com/murtazayucal/ui-creator
// Vue 2 adapter for the explore comparison (2.6 and 2.7). Temporary: copy it with the other explore files, delete afterwards.
//
// A single-file component cannot hold two components, so for the comparison:
//   1. move the component being explored to <Name>.current.vue, unchanged;
//   2. make <Name>.vue a thin wrapper that keeps the same props:
//
//      <template>
//        <ExploreSlot name="ProductCard" :original="Current" :drafts="drafts" :bind="$props" :on="$listeners" />
//      </template>
//      <script>
//      import ExploreSlot from "./__explore__/explore-slot.vue2.js";
//      import Current from "./ProductCard.current.vue";
//      import { drafts } from "./ProductCard.drafts.js";
//      export default {
//        components: { ExploreSlot },
//        props: { product: { type: Object, required: true } },
//        created() {
//          // Set here and not in data(): component definitions must not be made reactive.
//          this.Current = Current;
//          this.drafts = drafts;
//        },
//      };
//      </script>
//
// `bind` carries the props, `on` the listeners; `$listeners` forwards every event the parent listens to.
// Written with a render function, so it needs no template compiler and no build plugin of its own.
// All behaviour (which draft shows where, the bar, the listener) lives in explore-core.js.
import { attach } from "./explore-core.js";

const keysOf = (drafts) => Object.keys(drafts || {});

export default {
  name: "ExploreSlot",
  props: {
    name: { type: String, required: true },
    original: { type: [Object, Function], required: true },
    drafts: { type: Object, required: true },
    bind: { type: Object, default: () => ({}) },
    on: { type: Object, default: () => ({}) },
  },
  data() {
    return { key: "current" };
  },
  mounted() {
    this.slot = attach(this.name, this.$el, keysOf(this.drafts), (k) => {
      this.key = k;
    });
  },
  updated() {
    const keys = keysOf(this.drafts).join(",");
    if (this.slot && keys !== this.lastKeys) this.slot.setKeys(keysOf(this.drafts));
    this.lastKeys = keys;
  },
  beforeDestroy() {
    if (this.slot) this.slot.detach();
    this.slot = null;
  },
  render(h) {
    const view = this.key === "current" ? this.original : (this.drafts && this.drafts[this.key]) || this.original;
    // `attrs` behaves like v-bind="object": declared props are picked out of it, the rest stay attributes.
    // Copied first, because Vue removes the props it picks from the object it is given, and `bind` is the wrapper's own $props.
    return h("div", { attrs: { "data-ui-explore": this.name } }, [h(view, { key: this.key, attrs: Object.assign({}, this.bind), on: this.on })]);
  },
};
