<script setup>
import { computed } from 'vue'

const props = defineProps({ sale: Object })

const itemsCount = computed(() => props.sale.lines.reduce((s, l) => s + l.qty, 0))
const extrasCount = computed(() => props.sale.lines.reduce((s, l) => s + (l.extras || []).reduce((a, e) => a + e.qty, 0), 0))
const discountsList = computed(() => {
  if (props.sale.discounts) return props.sale.discounts
  if (props.sale.discount) return [props.sale.discount]
  return []
})
</script>

<template>
  <div class="bg-gray-900 border border-gray-800 rounded-xl p-4">
    <div class="flex items-center justify-between mb-3">
      <div>
        <p class="text-xs text-gray-500">Venta #{{ sale.id?.slice(0, 8) }}</p>
        <p class="text-xs text-gray-600">{{ sale.date }}</p>
      </div>
      <span class="text-lg font-bold text-brand">${{ sale.total }}</span>
    </div>
    <div class="space-y-1 text-sm border-t border-gray-800 pt-3">
      <div v-for="line in sale.lines" :key="line.productId" class="flex justify-between">
        <span>{{ line.name }} <span class="text-gray-500">x{{ line.qty }}</span></span>
        <span>${{ line.lineTotal }}</span>
      </div>
    </div>
    <div v-if="extrasCount" class="text-xs text-gray-500 mt-1">{{ extrasCount }} extra(s)</div>
    <div v-if="discountsList.length" class="border-t border-gray-800 pt-2 mt-2 space-y-0.5">
      <div v-for="d in discountsList" :key="d.id" class="flex justify-between text-xs text-green-400">
        <span>{{ d.name }}</span>
        <span>-${{ d.type === '%' ? ((sale.subtotal || 0) * d.value / 100).toFixed(2) : d.value }}</span>
      </div>
    </div>
    <div class="flex justify-between text-sm font-semibold border-t border-gray-800 pt-2 mt-2">
      <span>{{ itemsCount }} ítem(s)</span>
      <span class="text-brand">${{ sale.total }}</span>
    </div>
    <p v-if="sale.notes" class="text-xs text-gray-600 mt-2 italic">{{ sale.notes }}</p>
  </div>
</template>
