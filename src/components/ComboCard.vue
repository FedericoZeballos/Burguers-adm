<script setup>
import { computed, ref } from 'vue'
import { formatDate, daysUntil } from '../models/helpers'
import { useComboStore } from '../stores/comboStore'
import { useProductStore } from '../stores/productStore'

const props = defineProps({ combo: Object, compact: Boolean })
const emit = defineEmits(['edit', 'toggle', 'delete'])

const expanded = ref(false)
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

const marginClass = computed(() => (props.combo.profitMoney || 0) < 0 ? 'text-red-400' : 'text-green-400')
const profitClass = computed(() => (props.combo.profitPct || 0) < 0 ? 'text-red-400' : 'text-green-400')

const productsResolved = computed(() =>
  (props.combo.products || []).map(entry => {
    const p = prodStore.items.find(i => i.id === entry.productId)
    return { name: p ? p.name : '?', qty: entry.qty, cost: p ? p.cost : 0, subtotal: +(entry.qty * (p ? p.cost : 0)).toFixed(2) }
  })
)
</script>

<template>
  <div class="bg-gray-900 border rounded-xl p-4 transition-colors flex flex-col h-full" :class="expired ? 'border-red-800/50' : expiring ? 'border-yellow-800/50' : 'border-gray-800 hover:border-gray-700'">
    <div class="flex items-start justify-between mb-3">
      <div class="flex items-center gap-2 min-w-0">
        <button @click="expanded = !expanded" class="sm:hidden shrink-0 p-0.5 text-gray-500 hover:text-gray-300 transition-colors">
          <svg class="w-4 h-4 transition-transform" :class="expanded ? 'rotate-90' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </button>
        <div class="min-w-0">
          <h3 class="font-semibold flex items-center gap-2 truncate">
            {{ combo.name }}
            <span v-if="expired" class="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded-full shrink-0">Vencido</span>
            <span v-else-if="expiring" class="text-xs bg-yellow-900/50 text-yellow-400 px-2 py-0.5 rounded-full shrink-0">Próximo a vencer</span>
          </h3>
          <p v-if="combo.startDate || combo.endDate" class="text-xs text-gray-500 mt-0.5 break-words">
            {{ formatDate(combo.startDate) }} - {{ formatDate(combo.endDate) }}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0 mt-1">
        <span class="text-xs font-medium" :class="combo.active ? 'text-green-400' : 'text-gray-500'">{{ combo.active ? 'Activo' : 'Inactivo' }}</span>
        <button @click="emit('toggle', combo.id)" class="relative w-10 h-5 rounded-full transition-colors" :class="combo.active ? 'bg-green-500' : 'bg-gray-700'">
          <span class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform" :class="combo.active ? 'translate-x-5' : ''" />
        </button>
      </div>
    </div>
    <div v-if="!compact" :class="expanded ? 'flex' : 'hidden'" class="sm:flex flex-col flex-1 min-h-0 sm:overflow-visible overflow-y-auto scrollbar-thin">
      <div v-if="productsResolved.length" class="mt-3 pt-3 border-t border-gray-800">
        <p class="text-xs text-brand mb-1 font-medium">Productos</p>
        <div class="grid grid-cols-[auto_1fr_auto] gap-x-2 text-xs text-gray-500 mb-0.5 px-0">
          <span>Cant.</span>
          <span>($) Costo/u.</span>
          <span class="text-right">Subtotal</span>
        </div>
        <div v-for="p in productsResolved" :key="p.name" class="grid grid-cols-[auto_1fr_auto] gap-x-2 text-xs text-gray-400">
          <span class="shrink-0">x{{ p.qty }}</span>
          <span class="break-words min-w-0">{{ p.name }} <span class="text-gray-600">(${{ p.cost }})</span></span>
          <span class="shrink-0 text-right">${{ p.subtotal }}</span>
        </div>
      </div>

      <div class="mt-auto">
        <div class="flex justify-between items-center py-3 border-t border-b border-gray-800">
          <span class="text-sm text-gray-400">Disponibles:</span>
          <span class="font-medium" :class="stockClass">{{ available }}</span>
        </div>

        <div class="pt-3">
          <p class="text-xs text-brand mb-1 font-medium">Detalle costos:</p>
          <div class="space-y-1 text-sm">
            <div class="flex justify-between"><span class="text-gray-400">Costo Total:</span><span>${{ combo.cost }}</span></div>
            <div class="flex justify-between"><span class="text-gray-400">Margen:</span><span :class="marginClass">${{ combo.profitMoney }}</span></div>
            <div class="flex justify-between"><span class="text-gray-400">Ganancia:</span><span :class="profitClass">{{ combo.profitPct }}%</span></div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex justify-between items-center py-3 border-t border-b border-gray-800" :class="compact ? 'mt-auto' : ''">
      <span class="text-sm text-gray-400">Venta:</span>
      <span class="text-xl font-bold text-brand">${{ combo.salePrice }}</span>
    </div>

    <div class="flex justify-end gap-2 pt-3">
      <button @click="emit('edit', combo)" class="px-3 py-1.5 rounded-lg bg-blue-900/20 text-blue-400 hover:bg-blue-900/40 transition-colors flex items-center gap-1.5 text-xs font-medium" title="Editar">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
        <span>Editar combo</span>
      </button>
      <button @click="emit('delete', combo.id)" class="p-1.5 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/40 transition-colors" title="Eliminar">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
  </div>
</template>

<style>
.scrollbar-thin::-webkit-scrollbar { width: 4px; }
.scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
.scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
</style>
