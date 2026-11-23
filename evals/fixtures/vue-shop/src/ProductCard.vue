<script setup>
defineProps({ product: { type: Object, required: true } });
defineEmits(["add"]);
</script>

<template>
  <article class="flex flex-col rounded-lg border border-border bg-surface p-4">
    <div class="mb-3 h-28 rounded-md" :style="{ background: `oklch(0.9 0.06 ${product.hue})` }" role="img" :aria-label="product.title" />
    <h2 class="font-semibold">{{ product.title }}</h2>
    <p class="mt-1 text-sm text-muted">{{ product.description }}</p>
    <div class="mt-3 flex items-center justify-between">
      <span class="font-semibold">${{ product.price }}</span>
      <button type="button" class="h-9 rounded-md bg-primary px-3 text-sm text-primary-fg" @click="$emit('add')">Add to cart</button>
    </div>
  </article>
</template>
