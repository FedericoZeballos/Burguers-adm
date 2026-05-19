<script setup>
defineProps({ extras: Array, selected: { type: Array, default: () => [] } })
const emit = defineEmits(['add', 'remove'])
</script>

<template>
  <div>
    <label class="block text-sm text-gray-400 mb-2">Extras</label>
    <div class="space-y-1 max-h-40 overflow-y-auto">
      <div v-for="extra in extras.filter(e => e.active)" :key="extra.id" class="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-800">
        <span class="text-sm">{{ extra.name }} <span class="text-brand text-xs">+${{ extra.price }}</span></span>
        <div class="flex items-center gap-1">
          <button @click="emit('remove', extra)" class="w-6 h-6 flex items-center justify-center rounded bg-gray-700 text-xs hover:bg-gray-600">−</button>
          <span class="text-xs w-5 text-center text-white">{{ selected.find(s => s.id === extra.id)?.qty || 0 }}</span>
          <button @click="emit('add', extra)" class="w-6 h-6 flex items-center justify-center rounded bg-gray-700 text-xs hover:bg-gray-600">+</button>
        </div>
      </div>
      <p v-if="!extras.filter(e => e.active).length" class="text-xs text-gray-600 py-2 text-center">No hay extras disponibles</p>
    </div>
  </div>
</template>
