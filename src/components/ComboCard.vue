<script setup>
import { computed } from 'vue'
import { formatDate, daysUntil } from '../models/helpers'
import { useComboStore } from '../stores/comboStore'
import { useProductStore } from '../stores/productStore'

const props = defineProps({ combo: Object })
const emit = defineEmits(['edit', 'toggle', 'delete'])

const comboStore = useComboStore()
const prodStore = useProductStore()

const expiring = computed(() => {
  if (!props.combo.endDate) return false
  const d = daysUntil(props.combo.endDate)
  return d >= 0 && d <= 3
})

const expired = computed(() => {
  if (!props.combo.endDate) return false
  return daysUntil(props.combo.endDate) < 0
})

const available = computed(() => comboStore.getAvailableQty(props.combo))
const stockClass = computed(() => {
  if (available.value <= 0) return 'text-red-400'
  if (available.value <= 5) return 'text-yellow-400'
  return 'text-green-400'
})

const productsResolved = computed(() =>
  (props.combo.products || []).map(entry => {
    const p = prodStore.items.find(i => i.id === entry.productId)
    return { name: p ? p.name : '?', qty: entry.qty }
  })
)
</script>

<template>
  <div class="bg-gray-900 border rounded-xl p-4 transition-colors" :class="expired ? 'border-red-800/50' : expiring ? 'border-yellow-800/50' : 'border-gray-800 hover:border-gray-700'">
    <div class="flex items-start justify-between mb-3">
      <div>
        <h3 class="font-semibold flex items-center gap-2">
          {{ combo.name }}
          <span v-if="expired" class="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded-full">Vencido</span>
          <span v-else-if="expiring" class="text-xs bg-yellow-900/50 text-yellow-400 px-2 py-0.5 rounded-full">Próximo a vencer</span>
        </h3>
        <p v-if="combo.startDate || combo.endDate" class="text-xs text-gray-500 mt-0.5">
          {{ formatDate(combo.startDate) }} - {{ formatDate(combo.endDate) }}
        </p>
      </div>
      <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="combo.active ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-500'">
        {{ combo.active ? 'Activo' : 'Inactivo' }}
      </span>
    </div>
    <div class="space-y-1 text-sm">
      <div class="flex justify-between"><span class="text-gray-400">Costo:</span><span>${{ combo.cost }}</span></div>
      <div class="flex justify-between"><span class="text-gray-400">Venta:</span><span class="text-brand font-semibold">${{ combo.salePrice }}</span></div>
      <div class="flex justify-between"><span class="text-gray-400">Margen:</span><span class="text-green-400">${{ combo.profitMoney }}</span></div>
      <div class="flex justify-between"><span class="text-gray-400">Ganancia:</span><span class="text-green-400">{{ combo.profitPct }}%</span></div>
    </div>

    <div v-if="productsResolved.length" class="mt-3 pt-3 border-t border-gray-800">
      <p class="text-xs text-gray-500 mb-1 font-medium">Productos</p>
      <div v-for="p in productsResolved" :key="p.name" class="text-xs text-gray-400 flex justify-between">
        <span>{{ p.name }}</span>
        <span>x{{ p.qty }}</span>
      </div>
    </div>

    <div class="mt-3 pt-3 border-t border-gray-800">
      <div class="flex justify-between text-sm">
        <span class="text-gray-400">Disponibles:</span>
        <span class="font-medium" :class="stockClass">{{ available }}</span>
      </div>
    </div>

    <div class="flex gap-2 mt-3 pt-3 border-t border-gray-800">
      <button @click="emit('toggle', combo.id)" class="text-xs px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700">{{ combo.active ? 'Desactivar' : 'Activar' }}</button>
      <button @click="emit('edit', combo)" class="text-xs px-3 py-1 rounded-lg bg-brand/10 text-brand hover:bg-brand/20">Editar</button>
      <button @click="emit('delete', combo.id)" class="text-xs px-3 py-1 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/40">Eliminar</button>
    </div>
  </div>
</template>
