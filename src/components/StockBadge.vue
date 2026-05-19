<script setup>
import { computed } from 'vue'

const props = defineProps({ stock: Number, threshold: { type: Number, default: 5 } })

const variant = computed(() => {
  if (props.stock <= 0) return 'bg-red-900/50 text-red-400 border-red-800'
  if (props.stock <= props.threshold) return 'bg-yellow-900/50 text-yellow-400 border-yellow-800'
  return 'bg-green-900/50 text-green-400 border-green-800'
})
</script>

<template>
  <span class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border" :class="variant">
    {{ stock }} ud.
  </span>
</template>
