<script setup>
import { computed, ref } from 'vue'
import { useProductStore } from '../stores/productStore'
import { useIngredientStore } from '../stores/ingredientStore'
import { useSupplyStore } from '../stores/supplyStore'
import { formatUnit } from '../models/helpers'

const expanded = ref(false)

const props = defineProps({ product: Object, compact: Boolean })
const emit = defineEmits(['edit', 'toggle', 'delete'])

const prodStore = useProductStore()
const ingStore = useIngredientStore()
const supStore = useSupplyStore()

const statusClass = computed(() => props.product.active ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-500')
const available = computed(() => prodStore.getAvailableQty(props.product))
const stockClass = computed(() => {
  if (available.value <= 0) return 'text-red-400'
  if (available.value <= 5) return 'text-yellow-400'
  return 'text-green-400'
})

const margen = computed(() => +((props.product.salePrice || 0) - (props.product.cost || 0)).toFixed(2))
const marginClass = computed(() => margen.value < 0 ? 'text-red-400' : 'text-green-400')
const profitClass = computed(() => (props.product.profitPct || 0) < 0 ? 'text-red-400' : 'text-green-400')

const ingredientsResolved = computed(() =>
  (props.product.ingredients || []).map(ing => {
    const ref = ingStore.items.find(i => i.id === ing.id)
    const cost = ref ? ref.costPerUnit : 0
    return { name: ref ? ref.name : '?', qty: ing.qty, unit: ref ? ref.unit : '', cost, subtotal: +(ing.qty * cost).toFixed(2) }
  })
)

const suppliesResolved = computed(() =>
  (props.product.supplies || []).map(sup => {
    const ref = supStore.items.find(i => i.id === sup.id)
    const cost = ref ? ref.costPerUnit : 0
    return { name: ref ? ref.name : '?', qty: sup.qty, unit: ref ? ref.unit : '', cost, subtotal: +(sup.qty * cost).toFixed(2) }
  })
)
</script>

<template>
  <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors flex flex-col h-full">
    <div class="flex items-start justify-between mb-3">
      <div class="flex items-center gap-2 min-w-0">
        <button @click="expanded = !expanded" class="sm:hidden shrink-0 p-0.5 text-gray-500 hover:text-gray-300 transition-colors">
          <svg class="w-4 h-4 transition-transform" :class="expanded ? 'rotate-90' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </button>
        <div class="min-w-0">
          <h3 class="font-semibold truncate">{{ product.name }}</h3>
          <p v-if="product.description" class="text-sm text-gray-500 mt-0.5 break-words">{{ product.description }}</p>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0 mt-1">
        <span class="text-xs font-medium" :class="product.active ? 'text-green-400' : 'text-gray-500'">{{ product.active ? 'Activo' : 'Inactivo' }}</span>
        <button @click="emit('toggle', product.id)" class="relative w-10 h-5 rounded-full transition-colors" :class="product.active ? 'bg-green-500' : 'bg-gray-700'">
          <span class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform" :class="product.active ? 'translate-x-5' : ''" />
        </button>
      </div>
    </div>
    <div v-if="!compact" :class="expanded ? 'flex' : 'hidden'" class="sm:flex flex-col flex-1 min-h-0 sm:overflow-visible overflow-y-auto scrollbar-thin">
      <div v-if="ingredientsResolved.length" class="mt-3 pt-3 border-t border-gray-800">
        <p class="text-xs text-brand mb-1 font-medium">Ingredientes</p>
        <div class="grid grid-cols-[auto_1fr_auto] gap-x-2 text-xs text-gray-500 mb-0.5 px-0">
          <span>Cant.</span>
          <span>($) Costo/u.</span>
          <span class="text-right">Subtotal</span>
        </div>
        <div v-for="ing in ingredientsResolved" :key="ing.name" class="grid grid-cols-[auto_1fr_auto] gap-x-2 text-xs text-gray-400">
          <span class="shrink-0">x{{ ing.qty }}</span>
          <span class="break-words min-w-0"><span class="text-gray-600">{{ formatUnit(ing.unit, ing.qty) }}</span> {{ ing.name }} <span class="text-gray-600">(${{ ing.cost }})</span></span>
          <span class="shrink-0 text-right">${{ ing.subtotal }}</span>
        </div>
      </div>

      <div v-if="suppliesResolved.length" class="mt-2 pt-2 border-t border-gray-800">
        <p class="text-xs text-brand mb-1 font-medium">Insumos</p>
        <div class="grid grid-cols-[auto_1fr_auto] gap-x-2 text-xs text-gray-500 mb-0.5 px-0">
          <span>Cant.</span>
          <span>($) Costo/u.</span>
          <span class="text-right">Subtotal</span>
        </div>
        <div v-for="sup in suppliesResolved" :key="sup.name" class="grid grid-cols-[auto_1fr_auto] gap-x-2 text-xs text-gray-400">
          <span class="shrink-0">x{{ sup.qty }}</span>
          <span class="break-words min-w-0"><span class="text-gray-600">{{ formatUnit(sup.unit, sup.qty) }}</span> {{ sup.name }} <span class="text-gray-600">(${{ sup.cost }})</span></span>
          <span class="shrink-0 text-right">${{ sup.subtotal }}</span>
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
            <div class="flex justify-between"><span class="text-gray-400">Costo Total:</span><span>${{ product.cost }}</span></div>
          <div class="flex justify-between"><span class="text-gray-400">Margen:</span><span :class="marginClass">${{ margen }}</span></div>
          <div class="flex justify-between"><span class="text-gray-400">Ganancia:</span><span :class="profitClass">{{ product.profitPct }}%</span></div>
        </div>
        </div>
      </div>
    </div>

    <div class="flex justify-between items-center py-3 border-t border-b border-gray-800" :class="compact ? 'mt-auto' : ''">
      <span class="text-sm text-gray-400">Venta:</span>
      <span class="text-xl font-bold text-brand">${{ product.salePrice }}</span>
    </div>

    <div class="flex justify-end gap-2 pt-3">
      <button @click="emit('edit', product)" class="px-3 py-1.5 rounded-lg bg-blue-900/20 text-blue-400 hover:bg-blue-900/40 transition-colors flex items-center gap-1.5 text-xs font-medium" title="Editar">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
        <span>Editar producto</span>
      </button>
      <button @click="emit('delete', product.id)" class="p-1.5 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/40 transition-colors" title="Eliminar">
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
