<script setup>
import { computed } from 'vue'
import { useProductStore } from '../stores/productStore'

const props = defineProps({ product: Object })
const emit = defineEmits(['edit', 'toggle', 'delete'])

const prodStore = useProductStore()

const statusClass = computed(() => props.product.active ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-500')
const available = computed(() => prodStore.getAvailableQty(props.product))
const stockClass = computed(() => {
  if (available.value <= 0) return 'text-red-400'
  if (available.value <= 5) return 'text-yellow-400'
  return 'text-green-400'
})
</script>

<template>
  <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
    <div class="flex items-start justify-between mb-3">
      <div>
        <h3 class="font-semibold">{{ product.name }}</h3>
        <p v-if="product.description" class="text-sm text-gray-500 mt-0.5">{{ product.description }}</p>
      </div>
      <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="statusClass">
        {{ product.active ? 'Activo' : 'Inactivo' }}
      </span>
    </div>
    <div class="space-y-1 text-sm">
      <div class="flex justify-between"><span class="text-gray-400">Costo:</span><span>${{ product.cost }}</span></div>
      <div class="flex justify-between"><span class="text-gray-400">Venta:</span><span class="text-brand font-semibold">${{ product.salePrice }}</span></div>
      <div class="flex justify-between"><span class="text-gray-400">Ganancia:</span><span class="text-green-400">{{ product.profitPct }}%</span></div>
      <div class="flex justify-between pt-1 border-t border-gray-800">
        <span class="text-gray-400">Disponibles:</span>
        <span class="font-medium" :class="stockClass">{{ available }}</span>
      </div>
    </div>
    <div class="flex gap-2 mt-3 pt-3 border-t border-gray-800">
      <button @click="emit('toggle', product.id)" class="text-xs px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">{{ product.active ? 'Desactivar' : 'Activar' }}</button>
      <button @click="emit('edit', product)" class="text-xs px-3 py-1 rounded-lg bg-brand/10 text-brand hover:bg-brand/20 transition-colors">Editar</button>
      <button @click="emit('delete', product.id)" class="text-xs px-3 py-1 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/40 transition-colors">Eliminar</button>
    </div>
  </div>
</template>
