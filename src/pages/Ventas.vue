<script setup>
import { ref, computed } from 'vue'
import { useSalesStore } from '../stores/salesStore'
import { useProductStore } from '../stores/productStore'
import { useComboStore } from '../stores/comboStore'
import { useExtraStore } from '../stores/extraStore'
import { useDiscountStore } from '../stores/discountStore'
import { useIngredientStore } from '../stores/ingredientStore'
import { useSupplyStore } from '../stores/supplyStore'
import { calcSubtotal, calcDiscount } from '../models/helpers'
import Modal from '../components/Modal.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import SaleSummary from '../components/SaleSummary.vue'

const saleStore = useSalesStore()
const prodStore = useProductStore()
const comboStore = useComboStore()
const extraStore = useExtraStore()
const discStore = useDiscountStore()
const ingStore = useIngredientStore()
const supStore = useSupplyStore()

const showModal = ref(false)
const confirmSaveSale = ref(false)
const selectedType = ref('product')
const selectedId = ref('')
const selectedQty = ref(1)
const saleLines = ref([])
const saleDiscounts = ref([])
const saleNotes = ref('')
const expandedExtras = ref({})

const availableItems = computed(() => {
  if (selectedType.value === 'product') return prodStore.items.filter(p => p.active).map(p => ({ id: p.id, name: p.name, price: p.salePrice }))
  return comboStore.items.filter(c => c.active).map(c => ({ id: c.id, name: c.name, price: c.salePrice }))
})

const subtotalTotal = computed(() => {
  return saleLines.value.reduce((sum, line) => {
    const sub = calcSubtotal(line.unitPrice, line.qty)
    const extraSub = (line.extras || []).reduce((s, e) => s + e.price * e.qty, 0)
    return sum + sub + extraSub
  }, 0)
})

const discountAmount = computed(() => {
  return saleDiscounts.value.reduce((total, d) => total + calcDiscount(subtotalTotal.value - total, d.type, d.value), 0)
})

const finalTotal = computed(() => +(subtotalTotal.value - discountAmount.value).toFixed(2))

function addLine() {
  if (!selectedId.value || selectedQty.value < 1) return
  const item = availableItems.value.find(x => x.id === selectedId.value)
  if (!item) return
  const existing = saleLines.value.find(l => l.productId === selectedId.value && l.type === selectedType.value)
  if (existing) {
    existing.qty += selectedQty.value
  } else {
    saleLines.value.push({ productId: selectedId.value, type: selectedType.value, name: item.name, unitPrice: item.price, qty: selectedQty.value, extras: [] })
  }
  selectedId.value = ''
  selectedQty.value = 1
}

function removeLine(idx) {
  saleLines.value.splice(idx, 1)
}

function toggleExtras(idx) {
  expandedExtras.value[idx] = !expandedExtras.value[idx]
}

function addExtra(lineIdx, extra) {
  const line = saleLines.value[lineIdx]
  const existing = line.extras.find(e => e.id === extra.id)
  if (existing) existing.qty++
  else line.extras.push({ id: extra.id, name: extra.name, price: extra.price, type: extra.type, refId: extra.refId, qty: 1 })
}

function removeExtra(lineIdx, extraId) {
  const line = saleLines.value[lineIdx]
  const idx = line.extras.findIndex(e => e.id === extraId)
  if (idx === -1) return
  if (line.extras[idx].qty > 1) line.extras[idx].qty--
  else line.extras.splice(idx, 1)
}

function toggleDiscount(d) {
  const idx = saleDiscounts.value.findIndex(x => x.id === d.id)
  if (idx !== -1) saleDiscounts.value.splice(idx, 1)
  else saleDiscounts.value.push({ id: d.id, name: d.name, type: d.type, value: d.value })
}

function saveSale() {
  if (!saleLines.value.length) return
  confirmSaveSale.value = true
}

function doSaveSale() {
  confirmSaveSale.value = false
  saleStore.add({
    lines: saleLines.value,
    discounts: saleDiscounts.value,
    notes: saleNotes.value,
  })
  saleLines.value = []
  saleDiscounts.value = []
  saleNotes.value = ''
  showModal.value = false
}

const recentSales = computed(() => [...saleStore.items].reverse().slice(0, 20))
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <p class="text-sm text-gray-400">{{ saleStore.items.length }} ventas registradas</p>
      <button @click="showModal = true" class="px-4 py-2 bg-brand text-gray-900 font-medium rounded-lg hover:bg-brand-dark transition-colors text-sm">+ Nueva Venta</button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <SaleSummary v-for="sale in recentSales" :key="sale.id" :sale="sale" />
    </div>
    <p v-if="!saleStore.items.length" class="text-center text-gray-600 py-8">No hay ventas registradas</p>

    <ConfirmDialog :show="confirmSaveSale" title="Registrar venta" message="¿Confirmar esta venta? Se descontará el stock de los ingredientes e insumos utilizados." confirmText="Registrar" @confirm="doSaveSale" @cancel="confirmSaveSale = false" />

    <Modal :show="showModal" title="Nueva Venta" @close="showModal = false">
      <div class="space-y-4">
        <div class="flex gap-2">
          <button @click="selectedType = 'product'" class="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors" :class="selectedType === 'product' ? 'bg-brand text-gray-900' : 'bg-gray-800 text-gray-400'">Producto</button>
          <button @click="selectedType = 'combo'" class="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors" :class="selectedType === 'combo' ? 'bg-brand text-gray-900' : 'bg-gray-800 text-gray-400'">Combo</button>
        </div>

        <div class="flex flex-col sm:flex-row gap-2">
          <select v-model="selectedId" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none">
            <option value="">Seleccionar...</option>
            <option v-for="item in availableItems" :key="item.id" :value="item.id">{{ item.name }} - ${{ item.price }}</option>
          </select>
          <div class="flex gap-2">
            <input v-model.number="selectedQty" type="number" min="1" class="w-20 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none" />
            <button @click="addLine" class="whitespace-nowrap px-4 py-2 bg-brand text-gray-900 rounded-lg text-sm font-medium hover:bg-brand-dark">Agregar</button>
          </div>
        </div>

        <div v-if="saleLines.length" class="space-y-2 max-h-60 overflow-y-auto">
          <div v-for="(line, i) in saleLines" :key="i" class="bg-gray-800 rounded-lg p-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 min-w-0">
                <button v-if="line.type === 'product'" @click="toggleExtras(i)" class="text-gray-500 hover:text-white shrink-0 text-xs w-4">
                  {{ expandedExtras[i] ? '▾' : '▸' }}
                </button>
                <span v-else class="text-gray-600 shrink-0 text-xs w-4">◇</span>
                <span class="text-sm font-medium truncate">{{ line.name }}</span>
                <span class="text-xs text-gray-500 shrink-0">x{{ line.qty }}</span>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <span v-if="line.type === 'product' && line.extras.length" class="text-xs text-gray-500">+{{ line.extras.reduce((s, e) => s + e.qty, 0) }}</span>
                <span class="text-sm text-brand">${{ calcSubtotal(line.unitPrice, line.qty) }}</span>
                <button @click="removeLine(i)" class="text-red-400 text-xs hover:text-red-300">&times;</button>
              </div>
            </div>

            <div v-if="line.type === 'product' && line.extras.length && !expandedExtras[i]" class="mt-1 text-xs text-gray-500 ml-6">
              <span v-for="(extra, ei) in line.extras" :key="extra.id" class="mr-2">+{{ extra.name }} x{{ extra.qty }}<span v-if="ei < line.extras.length - 1">, </span></span>
            </div>

            <div v-if="expandedExtras[i] && line.type === 'product'" class="mt-2 ml-4 border-l border-gray-700 pl-3 space-y-1">
              <div v-for="extra in extraStore.items.filter(e => e.active)" :key="extra.id" class="flex items-center justify-between py-1">
                <span class="text-xs text-gray-400">{{ extra.name }} <span class="text-brand">+${{ extra.price }}</span></span>
                <div class="flex items-center gap-1">
                  <button @click="removeExtra(i, extra.id)" class="w-5 h-5 flex items-center justify-center rounded bg-gray-700 text-xs hover:bg-gray-600">−</button>
                  <span class="text-xs w-4 text-center text-white">{{ line.extras.find(e => e.id === extra.id)?.qty || 0 }}</span>
                  <button @click="addExtra(i, extra)" class="w-5 h-5 flex items-center justify-center rounded bg-gray-700 text-xs hover:bg-gray-600">+</button>
                </div>
              </div>
              <p v-if="!extraStore.items.filter(e => e.active).length" class="text-xs text-gray-600 py-1">Sin extras disponibles</p>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-sm text-gray-400 mb-1">Descuentos</label>
          <div class="flex flex-wrap gap-1">
            <button v-for="d in discStore.items.filter(d => d.active)" :key="d.id" @click="toggleDiscount(d)"
              class="text-xs px-2 py-1 rounded-full transition-colors"
              :class="saleDiscounts.find(x => x.id === d.id) ? 'bg-brand/20 text-brand' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'"
            >{{ d.name }} ({{ d.type === '%' ? `${d.value}%` : `$${d.value}` }})</button>
          </div>
          <p v-if="!discStore.items.filter(d => d.active).length" class="text-xs text-gray-600 mt-1">Sin descuentos disponibles</p>
        </div>

        <div>
          <label class="block text-sm text-gray-400 mb-1">Observaciones</label>
          <textarea v-model="saleNotes" rows="2" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none resize-none" />
        </div>

        <div class="bg-gray-800 rounded-lg p-3 text-sm space-y-1">
          <div class="flex justify-between"><span class="text-gray-400">Subtotal:</span><span>${{ subtotalTotal }}</span></div>
          <div v-for="d in saleDiscounts" :key="d.id" class="flex justify-between text-green-400 text-xs"><span>{{ d.name }}:</span><span>-${{ calcDiscount(subtotalTotal, d.type, d.value) }}</span></div>
          <div v-if="discountAmount" class="flex justify-between text-green-400"><span>Descuento total:</span><span>-${{ discountAmount }}</span></div>
          <div class="flex justify-between text-base font-bold border-t border-gray-700 pt-2"><span>Total:</span><span class="text-brand">${{ finalTotal }}</span></div>
        </div>

        <div class="flex gap-2">
          <button @click="saveSale" class="flex-1 px-4 py-2 bg-brand text-gray-900 font-medium rounded-lg hover:bg-brand-dark text-sm" :disabled="!saleLines.length">Registrar Venta</button>
          <button @click="showModal = false" class="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 text-sm">Cancelar</button>
        </div>
      </div>
    </Modal>
  </div>
</template>
