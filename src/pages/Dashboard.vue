<script setup>
import { computed } from 'vue'
import { useIngredientStore } from '../stores/ingredientStore'
import { useSupplyStore } from '../stores/supplyStore'
import { useProductStore } from '../stores/productStore'
import { useComboStore } from '../stores/comboStore'
import { useSalesStore } from '../stores/salesStore'
import { daysUntil, isExpired, isNearExpiry, formatDate } from '../models/helpers'
import StatsCard from '../components/StatsCard.vue'
import StockBadge from '../components/StockBadge.vue'

const ingStore = useIngredientStore()
const supStore = useSupplyStore()
const prodStore = useProductStore()
const comboStore = useComboStore()
const saleStore = useSalesStore()

const today = new Date().toISOString().slice(0, 10)
const thisMonth = today.slice(0, 7)

const daySales = computed(() => saleStore.items.filter(s => s.date === today))
const monthSales = computed(() => saleStore.items.filter(s => s.date.startsWith(thisMonth)))

const dayTotal = computed(() => daySales.value.reduce((s, i) => s + i.total, 0))
const monthTotal = computed(() => monthSales.value.reduce((s, i) => s + i.total, 0))
const dayCount = computed(() => daySales.value.reduce((s, i) => s + i.lines.reduce((a, l) => a + l.qty, 0), 0))

const topProducts = computed(() => {
  const map = {}
  saleStore.items.forEach(s => s.lines.forEach(l => {
    map[l.name] = (map[l.name] || 0) + l.qty
  }))
  return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5)
})

const topProfit = computed(() => {
  const map = {}
  saleStore.items.forEach(s => s.lines.forEach(l => {
    const combo = comboStore.items.find(c => c.name === l.name)
    const prod = prodStore.items.find(p => p.name === l.name)
    const cost = combo ? combo.cost * l.qty : (prod ? prod.cost * l.qty : 0)
    const productRevenue = (l.subtotal || l.unitPrice * l.qty)
    const profit = (productRevenue - cost) + (l.extraSubtotal || 0)
    map[l.name] = (map[l.name] || 0) + profit
  }))
  return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5)
})

const expiringIngredients = computed(() => {
  return ingStore.items
    .filter(i => i.expiryDate && isNearExpiry(i.expiryDate, 7))
    .sort((a, b) => daysUntil(a.expiryDate) - daysUntil(b.expiryDate))
})

const lowStock = computed(() => {
  return [...ingStore.items.filter(i => i.stock <= 5), ...supStore.items.filter(s => s.stock <= 5)]
})

const expiringCombos = computed(() => {
  return comboStore.items.filter(c => c.endDate && isNearExpiry(c.endDate, 5))
})
</script>

<template>
  <div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatsCard title="Ventas Hoy" :value="`$${dayTotal}`" :subtitle="`${dayCount} productos`" icon="💰" color="brand" />
      <StatsCard title="Ventas del Mes" :value="`$${monthTotal}`" :subtitle="`${monthSales.length} ventas`" icon="📈" color="green-400" />
      <StatsCard title="Productos" :value="prodStore.items.length" subtitle="registrados" icon="🍔" color="blue-400" />
      <StatsCard title="Combos" :value="comboStore.items.length" subtitle="creados" icon="🎯" color="purple-400" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 class="font-semibold mb-3">Productos más vendidos</h3>
        <div v-if="topProducts.length" class="space-y-2">
          <div v-for="([name, qty], i) in topProducts" :key="name" class="flex items-center justify-between text-sm">
            <span class="flex items-center gap-2"><span class="text-gray-600 w-5">{{ i + 1 }}.</span>{{ name }}</span>
            <span class="text-brand font-medium">{{ qty }} vendidos</span>
          </div>
        </div>
        <p v-else class="text-sm text-gray-600 text-center py-4">Sin ventas registradas</p>
      </div>

      <div class="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 class="font-semibold mb-3">Mayor ganancia</h3>
        <div v-if="topProfit.length" class="space-y-2">
          <div v-for="([name, profit], i) in topProfit" :key="name" class="flex items-center justify-between text-sm">
            <span class="flex items-center gap-2"><span class="text-gray-600 w-5">{{ i + 1 }}.</span>{{ name }}</span>
            <span class="text-green-400 font-medium">+${{ profit.toFixed(2) }}</span>
          </div>
        </div>
        <p v-else class="text-sm text-gray-600 text-center py-4">Sin datos suficientes</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 class="font-semibold mb-3 flex items-center gap-2">
          Ingredientes por vencer
          <span v-if="expiringIngredients.length" class="text-xs bg-yellow-900/50 text-yellow-400 px-2 py-0.5 rounded-full">{{ expiringIngredients.length }}</span>
        </h3>
        <div v-if="expiringIngredients.length" class="space-y-2">
          <div v-for="ing in expiringIngredients" :key="ing.id" class="flex items-center justify-between text-sm">
            <span>{{ ing.name }}</span>
            <span class="text-yellow-400 text-xs">{{ formatDate(ing.expiryDate) }}</span>
          </div>
        </div>
        <p v-else class="text-sm text-gray-600 text-center py-4">Sin ingredientes próximos a vencer</p>
      </div>

      <div class="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 class="font-semibold mb-3">Stock bajo</h3>
        <div v-if="lowStock.length" class="space-y-2">
          <div v-for="item in lowStock" :key="item.id" class="flex items-center justify-between text-sm">
            <span>{{ item.name }}</span>
            <StockBadge :stock="item.stock" />
          </div>
        </div>
        <p v-else class="text-sm text-gray-600 text-center py-4">Stock suficiente</p>
      </div>

      <div class="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 class="font-semibold mb-3 flex items-center gap-2">
          Combos próximos a vencer
          <span v-if="expiringCombos.length" class="text-xs bg-yellow-900/50 text-yellow-400 px-2 py-0.5 rounded-full">{{ expiringCombos.length }}</span>
        </h3>
        <div v-if="expiringCombos.length" class="space-y-2">
          <div v-for="c in expiringCombos" :key="c.id" class="flex items-center justify-between text-sm">
            <span>{{ c.name }}</span>
            <span class="text-yellow-400 text-xs">Vence {{ formatDate(c.endDate) }}</span>
          </div>
        </div>
        <p v-else class="text-sm text-gray-600 text-center py-4">Sin combos próximos a vencer</p>
      </div>
    </div>
  </div>
</template>
