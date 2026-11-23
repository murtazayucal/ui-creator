<!-- ui-creator · Copyright (c) 2026 Murtaza Mehdi Yucal · MIT License · https://github.com/murtazayucal/ui-creator -->
<!--
  Vue 3 adapter for the explore comparison. Temporary: copy it with the other explore files, delete afterwards.

  A single-file component cannot hold two components, so for the comparison:
    1. move the component being explored to <Name>.current.vue, unchanged;
    2. make <Name>.vue a thin wrapper:

       <script setup>
       import ExploreSlot from "./__explore__/ExploreSlot.vue";
       import Current from "./ProductCard.current.vue";
       import { drafts } from "./ProductCard.drafts.js";
       defineProps({ product: Object });
       defineEmits(["add"]);
       </script>
       <template>
         <ExploreSlot name="ProductCard" :original="Current" :drafts="drafts" :bind="{ product, onAdd: () => $emit('add') }" />
       </template>

  Pass props and listeners in `bind`; a listener for the event "add" is the key `onAdd`.
  All behaviour (which draft shows where, the bar, the listener) lives in explore-core.js.
-->
<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { attach } from "./explore-core.js";

const p = defineProps({
  name: { type: String, required: true },
  original: { type: [Object, Function], required: true },
  drafts: { type: Object, required: true },
  bind: { type: Object, default: () => ({}) },
});

const el = ref(null);
const key = ref("current");
let slot = null;

onMounted(() => {
  slot = attach(p.name, el.value, Object.keys(p.drafts), (k) => (key.value = k));
});
watch(
  () => Object.keys(p.drafts).join(","),
  (keys) => slot?.setKeys(keys ? keys.split(",") : [])
);
onBeforeUnmount(() => slot?.detach());

const view = computed(() => (key.value === "current" ? p.original : p.drafts[key.value] ?? p.original));
</script>

<template>
  <div ref="el" :data-ui-explore="name">
    <component :is="view" v-bind="bind" />
  </div>
</template>
