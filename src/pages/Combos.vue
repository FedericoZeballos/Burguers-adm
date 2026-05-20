<script setup>
import { ref, computed } from 'vue'
import { useComboStore } from '../stores/comboStore'
import { useProductStore } from '../stores/productStore'
import { daysUntil, formatDate } from '../models/helpers'
import Modal from '../components/Modal.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import ComboCard from '../components/ComboCard.vue'

const store = useComboStore()
const prodStore = useProductStore()

const showModal = ref(false)
const editing = ref(null)
const confirmDeleteId = ref(null)
const confirmSave = ref(false)
const form = ref({ name: '', products: [], salePrice: 0, startDate: '', endDate: '' })

function openCreate() {
  editing.value = null
  form.value = { name: '', products: [], salePrice: 0, startDate: '', endDate: '' }
  showModal.value = true
}

function openEdit(item) {
  editing.value = item.id
  form.value = {
    name: item.name,
    products: item.products.map(p => ({ ...p })),
    salePrice: item.salePrice,
    startDate: item.startDate,
    endDate: item.endDate,
  }
  showModal.value = true
}

const previewCost = computed(() => store.calcComboCost(form.value.products))
const previewProfitPct = computed(() => {
  if (previewCost.value === 0) return 0
  return +(((form.value.salePrice - previewCost.value) / previewCost.value) * 100).toFixed(1)
})
const previewProfitMoney = computed(() => +(form.value.salePrice - previewCost.value).toFixed(2))

const prodToAdd = ref('')

function addProd() {
  if (!prodToAdd.value) return
  const id = prodToAdd.value
  const existing = form.value.products.find(p => p.productId === id)
  if (existing) existing.qty++
  else form.value.products.push({ productId: id, qty: 1 })
  prodToAdd.value = ''
}
function incProd(idx) { form.value.products[idx].qty++ }
function decProd(idx) {
  if (form.value.products[idx].qty > 1) form.value.products[idx].qty--
}
function removeProd(idx) { form.value.products.splice(idx, 1) }

function save() {
  if (!form.value.name.trim()) return
  if (editing.value) { confirmSave.value = true; return }
  store.add(form.value)
  showModal.value = false
}

function doSave() {
  confirmSave.value = false
  store.update(editing.value, form.value)
  showModal.value = false
}

function confirmDelete(id) {
  confirmDeleteId.value = id
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <p class="text-sm text-gray-400">{{ store.items.length }} combos</p>
      <button @click="openCreate" class="px-4 py-2 bg-brand text-gray-900 font-medium rounded-lg hover:bg-brand-dark transition-colors text-sm">+ Nuevo</button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <ComboCard v-for="c in store.items" :key="c.id" :combo="c" @edit="openEdit" @toggle="store.toggle" @delete="confirmDelete" />
    </div>
    <p v-if="!store.items.length" class="text-center text-gray-600 py-8">No hay combos. ¡Crea uno!</p>

    <ConfirmDialog :show="!!confirmDeleteId" title="Eliminar combo" message="¿Eliminar este combo? Esta acción no se puede deshacer." confirmText="Eliminar" :danger="true" @confirm="store.remove(confirmDeleteId); confirmDeleteId = null" @cancel="confirmDeleteId = null" />
    <ConfirmDialog :show="confirmSave" title="Guardar cambios" message="¿Confirmar los cambios en este combo?" confirmText="Guardar" @confirm="doSave" @cancel="confirmSave = false" />
    <Modal :show="showModal" :title="editing ? 'Editar Combo' : 'Nuevo Combo'" @close="showModal = false">
      <form @submit.prevent="save" class="space-y-3">
        <div>
          <label class="block text-sm text-gray-400 mb-1">Nombre</label>
          <input v-model="form.name" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none" required />
        </div>

        <div class="bg-gray-800/50 rounded-lg p-3">
          <p class="text-sm font-semibold text-gray-300 mb-3">Productos incluidos</p>
          <select v-model="prodToAdd" @change="addProd" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs focus:border-brand outline-none">
            <option value="">Agregar producto...</option>
            <option v-for="p in prodStore.items.filter(p => p.active)" :key="p.id" :value="p.id">{{ p.name }} (${{ p.cost }}/un)</option>
          </select>
          <div v-for="(entry, idx) in form.products" :key="entry.productId" class="flex items-center justify-between text-xs text-gray-400 py-1 mt-1">
            <div class="flex items-center gap-1 min-w-0">
              <button type="button" @click="decProd(idx)" class="w-5 h-5 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600 shrink-0">−</button>
              <span class="w-4 text-center text-white shrink-0">{{ entry.qty }}</span>
              <button type="button" @click="incProd(idx)" class="w-5 h-5 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600 shrink-0">+</button>
              <span class="ml-2 truncate">{{ prodStore.items.find(p => p.id === entry.productId)?.name }} <span class="text-gray-600">(${{ prodStore.items.find(p => p.id === entry.productId)?.cost }}/un)</span></span>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-gray-300">${{ +(entry.qty * (prodStore.items.find(p => p.id === entry.productId)?.cost || 0)).toFixed(2) }}</span>
              <button type="button" @click="removeProd(idx)" class="w-5 h-5 flex items-center justify-center rounded bg-gray-700 text-xs text-red-400 hover:bg-red-900/40 hover:text-red-300">&times;</button>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-sm text-gray-400 mb-1">Precio de venta</label>
          <input v-model.number="form.salePrice" type="number" step="0.01" min="0" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none" required />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm text-gray-400 mb-1">Fecha inicio</label>
            <input v-model="form.startDate" type="date" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none" />
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">Fecha límite</label>
            <input v-model="form.endDate" type="date" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none" />
          </div>
        </div>

        <div class="bg-gray-800 border border-brand/10 rounded-lg p-3 text-sm space-y-1">
          <div class="flex justify-between"><span class="text-gray-400">Costo:</span><span>${{ previewCost }}</span></div>
          <div class="flex justify-between"><span class="text-gray-400">Precio venta:</span><span class="text-brand font-semibold">${{ form.salePrice }}</span></div>
          <div class="flex justify-between"><span class="text-gray-400">Margen:</span><span class="text-green-400">{{ previewProfitPct }}%</span></div>
          <div class="flex justify-between"><span class="text-gray-400">Ganancia:</span><span class="text-green-400">${{ previewProfitMoney }}</span></div>
          <div v-if="previewProfitMoney < 0" class="text-red-400 text-xs mt-1">⚠️ El precio de venta es menor al costo</div>
        </div>

        <div class="flex gap-2 pt-2">
          <button type="submit" class="flex-1 px-4 py-2 bg-brand text-gray-900 font-medium rounded-lg hover:bg-brand-dark">{{ editing ? 'Guardar' : 'Crear' }}</button>
          <button type="button" @click="showModal = false" class="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700">Cancelar</button>
        </div>
      </form>
    </Modal>
  </div>
</template>
