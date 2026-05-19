<script setup>
defineProps({ title: String, value: [String, Number], subtitle: String, icon: String, color: { type: String, default: 'brand' } })
</script>

<template>
  <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
    <div class="flex items-start justify-between">
      <div>
        <p class="text-sm text-gray-400">{{ title }}</p>
        <p class="text-2xl font-bold mt-1" :class="`text-${color}`">{{ value }}</p>
        <p v-if="subtitle" class="text-xs text-gray-500 mt-1">{{ subtitle }}</p>
      </div>
      <span v-if="icon" class="text-2xl">{{ icon }}</span>
    </div>
  </div>
</template>
