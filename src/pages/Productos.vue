<script setup>
import { ref, computed, watch } from 'vue'
import { useProductStore } from '../stores/productStore'
import { useIngredientStore } from '../stores/ingredientStore'
import { useSupplyStore } from '../stores/supplyStore'
import { getStepForUnit, formatUnit } from '../models/helpers'
import Modal from '../components/Modal.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import ProductCard from '../components/ProductCard.vue'

const store = useProductStore()
const ingStore = useIngredientStore()
const supStore = useSupplyStore()

const showModal = ref(false)
const editing = ref(null)
const confirmDeleteId = ref(null)
const compactView = ref(false)
const confirmSave = ref(false)
const form = ref({ name: '', description: '', ingredients: [], supplies: [] })
const profitPct = ref(100)
const salePrice = ref(0)
const editingSale = ref(false)

function openCreate() {
  editing.value = null
  form.value = { name: '', description: '', ingredients: [], supplies: [] }
  profitPct.value = 100
  salePrice.value = 0
  showModal.value = true
}

function openEdit(item) {
  editing.value = item.id
  form.value = {
    name: item.name,
    description: item.description,
    ingredients: item.ingredients.map(i => ({ ...i })),
    supplies: item.supplies.map(s => ({ ...s })),
  }
  profitPct.value = item.profitPct
  salePrice.value = item.salePrice
  showModal.value = true
}

const previewCost = computed(() => {
  let cost = 0
  for (const ing of form.value.ingredients) {
    const ref = ingStore.items.find(i => i.id === ing.id)
    if (ref) cost += ref.costPerUnit * ing.qty
  }
  for (const sup of form.value.supplies) {
    const ref = supStore.items.find(i => i.id === sup.id)
    if (ref) cost += ref.costPerUnit * sup.qty
  }
  return +cost.toFixed(2)
})

watch(profitPct, (val) => {
  if (editingSale.value) return
  if (previewCost.value > 0) salePrice.value = +(previewCost.value * (1 + val / 100)).toFixed(2)
})

watch(previewCost, () => {
  if (previewCost.value > 0 && salePrice.value > 0) {
    profitPct.value = +(((salePrice.value / previewCost.value) - 1) * 100).toFixed(4)
  }
})

function onSaleBlur() {
  editingSale.value = false
  if (previewCost.value > 0 && salePrice.value > 0) {
    profitPct.value = +(((salePrice.value / previewCost.value) - 1) * 100).toFixed(4)
  }
}

function onSaleFocus() {
  editingSale.value = true
}

function onSaleEnter(e) {
  onSaleBlur()
  e.target.blur()
}

const ingToAdd = ref('')
const supToAdd = ref('')

function addIng() {
  if (!ingToAdd.value) return
  const id = ingToAdd.value
  const existing = form.value.ingredients.find(i => i.id === id)
  if (existing) existing.qty++
  else form.value.ingredients.push({ id, qty: 1 })
  ingToAdd.value = ''
}
function incIng(idx) {
  const ref = ingStore.items.find(i => i.id === form.value.ingredients[idx].id)
  const step = ref ? getStepForUnit(ref.unit) : 1
  form.value.ingredients[idx].qty = +(+form.value.ingredients[idx].qty + step).toFixed(1)
}
function decIng(idx) {
  const ref = ingStore.items.find(i => i.id === form.value.ingredients[idx].id)
  const step = ref ? getStepForUnit(ref.unit) : 1
  const next = +(+form.value.ingredients[idx].qty - step).toFixed(1)
  if (next >= step) form.value.ingredients[idx].qty = next
}
function removeIng(idx) { form.value.ingredients.splice(idx, 1) }

function addSup() {
  if (!supToAdd.value) return
  const id = supToAdd.value
  const existing = form.value.supplies.find(s => s.id === id)
  if (existing) existing.qty++
  else form.value.supplies.push({ id, qty: 1 })
  supToAdd.value = ''
}
function incSup(idx) {
  const ref = supStore.items.find(s => s.id === form.value.supplies[idx].id)
  const step = ref ? getStepForUnit(ref.unit) : 1
  form.value.supplies[idx].qty = +(+form.value.supplies[idx].qty + step).toFixed(1)
}
function decSup(idx) {
  const ref = supStore.items.find(s => s.id === form.value.supplies[idx].id)
  const step = ref ? getStepForUnit(ref.unit) : 1
  const next = +(+form.value.supplies[idx].qty - step).toFixed(1)
  if (next >= step) form.value.supplies[idx].qty = next
}
function removeSup(idx) { form.value.supplies.splice(idx, 1) }

function save() {
  if (!form.value.name.trim()) return
  const data = { ...form.value, profitPct: profitPct.value, salePrice: salePrice.value }
  if (editing.value) { confirmSave.value = true; return }
  store.add(data)
  showModal.value = false
}

function doSave() {
  confirmSave.value = false
  const data = { ...form.value, profitPct: profitPct.value, salePrice: salePrice.value }
  store.update(editing.value, data)
  showModal.value = false
}

function confirmDelete(id) {
  confirmDeleteId.value = id
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <p class="text-sm text-gray-400">{{ store.items.length }} productos</p>
        <button @click="compactView = !compactView" class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors" :class="compactView ? 'bg-brand/20 text-brand' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          {{ compactView ? 'Vista completa' : 'Vista resumida' }}
        </button>
      </div>
      <button @click="openCreate" class="px-4 py-2 bg-brand text-gray-900 font-medium rounded-lg hover:bg-brand-dark transition-colors text-sm">+ Nuevo</button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <ProductCard v-for="p in store.items" :key="p.id" :product="p" :compact="compactView" @edit="openEdit" @toggle="store.toggle" @delete="confirmDelete" />
    </div>
    <p v-if="!store.items.length" class="text-center text-gray-600 py-8">No hay productos. ¡Crea uno!</p>

    <ConfirmDialog :show="!!confirmDeleteId" title="Eliminar producto" message="¿Eliminar este producto? Esta acción no se puede deshacer." confirmText="Eliminar" :danger="true" @confirm="store.remove(confirmDeleteId); confirmDeleteId = null" @cancel="confirmDeleteId = null" />
    <ConfirmDialog :show="confirmSave" title="Guardar cambios" message="¿Confirmar los cambios en este producto?" confirmText="Guardar" @confirm="doSave" @cancel="confirmSave = false" />
    <Modal :show="showModal" :title="editing ? 'Editar Producto' : 'Nuevo Producto'" @close="showModal = false">
      <form @submit.prevent="save" class="space-y-3">
        <div>
          <label class="block text-sm text-gray-400 mb-1">Nombre</label>
          <input v-model="form.name" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none" required />
        </div>
        <div>
          <label class="block text-sm text-gray-400 mb-1">Descripción</label>
          <input v-model="form.description" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm text-gray-400 mb-1">% Ganancia</label>
            <input v-model.number="profitPct" type="number" min="0" step="any" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none" />
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">Precio venta $</label>
            <input v-model.number="salePrice" type="number" min="0" step="any" @focus="onSaleFocus" @blur="onSaleBlur" @keydown.enter.prevent="onSaleEnter" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none" />
          </div>
        </div>

        <div class="bg-gray-800/50 rounded-lg p-3">
          <p class="text-sm font-semibold text-gray-300 mb-3">Ingredientes</p>
          <select v-model="ingToAdd" @change="addIng" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs focus:border-brand outline-none">
            <option value="">Agregar ingrediente...</option>
            <option v-for="ing in ingStore.items" :key="ing.id" :value="ing.id">{{ ing.name }} (${{ ing.costPerUnit }}/{{ ing.unit }})</option>
          </select>
          <div v-for="(entry, idx) in form.ingredients" :key="entry.id" class="flex items-center justify-between text-xs text-gray-400 py-1 mt-1">
            <div class="flex items-center gap-1 min-w-0">
              <button type="button" @click="decIng(idx)" class="w-5 h-5 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600 shrink-0">−</button>
              <input v-model.number="entry.qty" type="number" min="0" step="any" class="w-12 text-center bg-gray-800 border border-gray-700 rounded px-1 py-0.5 text-xs text-white" />
              <button type="button" @click="incIng(idx)" class="w-5 h-5 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600 shrink-0">+</button>
              <span class="ml-2 truncate">{{ ingStore.items.find(i => i.id === entry.id)?.name }} <span class="text-gray-600">(${{ ingStore.items.find(i => i.id === entry.id)?.costPerUnit }}/{{ ingStore.items.find(i => i.id === entry.id)?.unit }})</span></span>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-gray-300">${{ +(entry.qty * (ingStore.items.find(i => i.id === entry.id)?.costPerUnit || 0)).toFixed(2) }}</span>
              <button type="button" @click="removeIng(idx)" class="w-5 h-5 flex items-center justify-center rounded bg-gray-700 text-xs text-red-400 hover:bg-red-900/40 hover:text-red-300">&times;</button>
            </div>
          </div>
        </div>

        <div class="bg-gray-800/50 rounded-lg p-3">
          <p class="text-sm font-semibold text-gray-300 mb-3">Insumos</p>
          <select v-model="supToAdd" @change="addSup" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs focus:border-brand outline-none">
            <option value="">Agregar insumo...</option>
            <option v-for="sup in supStore.items" :key="sup.id" :value="sup.id">{{ sup.name }} (${{ sup.costPerUnit }}/{{ sup.unit }})</option>
          </select>
          <div v-for="(entry, idx) in form.supplies" :key="entry.id" class="flex items-center justify-between text-xs text-gray-400 py-1 mt-1">
            <div class="flex items-center gap-1 min-w-0">
              <button type="button" @click="decSup(idx)" class="w-5 h-5 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600 shrink-0">−</button>
              <input v-model.number="entry.qty" type="number" min="0" step="any" class="w-12 text-center bg-gray-800 border border-gray-700 rounded px-1 py-0.5 text-xs text-white" />
              <button type="button" @click="incSup(idx)" class="w-5 h-5 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600 shrink-0">+</button>
              <span class="ml-2 truncate">{{ supStore.items.find(s => s.id === entry.id)?.name }} <span class="text-gray-600">(${{ supStore.items.find(s => s.id === entry.id)?.costPerUnit }}/{{ supStore.items.find(s => s.id === entry.id)?.unit }})</span></span>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-gray-300">${{ +(entry.qty * (supStore.items.find(s => s.id === entry.id)?.costPerUnit || 0)).toFixed(2) }}</span>
              <button type="button" @click="removeSup(idx)" class="w-5 h-5 flex items-center justify-center rounded bg-gray-700 text-xs text-red-400 hover:bg-red-900/40 hover:text-red-300">&times;</button>
            </div>
          </div>
        </div>

        <div class="bg-gray-800 border border-brand/10 rounded-lg p-3 text-sm space-y-1">
          <div v-for="entry in form.ingredients" :key="entry.id" class="flex justify-between text-xs text-gray-500">
            <span>x{{ entry.qty }} <span class="text-gray-600">{{ formatUnit(ingStore.items.find(i => i.id === entry.id)?.unit || '', entry.qty) }}</span> {{ ingStore.items.find(i => i.id === entry.id)?.name }}</span>
            <span>${{ ((ingStore.items.find(i => i.id === entry.id)?.costPerUnit || 0) * entry.qty).toFixed(2) }}</span>
          </div>
          <div v-for="entry in form.supplies" :key="entry.id" class="flex justify-between text-xs text-gray-500">
            <span>x{{ entry.qty }} <span class="text-gray-600">{{ formatUnit(supStore.items.find(i => i.id === entry.id)?.unit || '', entry.qty) }}</span> {{ supStore.items.find(i => i.id === entry.id)?.name }}</span>
            <span>${{ ((supStore.items.find(i => i.id === entry.id)?.costPerUnit || 0) * entry.qty).toFixed(2) }}</span>
          </div>
          <div class="pt-2 border-t border-gray-700">
            <p class="text-xs text-brand mb-1 font-medium">Costos</p>
            <div class="space-y-1">
              <div class="flex justify-between"><span class="text-gray-400">Costo total:</span><span>${{ previewCost }}</span></div>
              <div class="flex justify-between"><span class="text-gray-400">Ganancia:</span><span :class="previewCost > 0 && ((salePrice / previewCost - 1) * 100) < 0 ? 'text-red-400' : 'text-green-400'">{{ previewCost > 0 ? ((salePrice / previewCost - 1) * 100).toFixed(2) : 0 }}%</span></div>
              <div class="flex justify-between"><span class="text-gray-400">Precio venta:</span><span class="text-brand font-semibold">${{ salePrice }}</span></div>
            </div>
          </div>
        </div>

        <div class="flex gap-2 pt-2">
          <button type="submit" class="flex-1 px-4 py-2 bg-brand text-gray-900 font-medium rounded-lg hover:bg-brand-dark">{{ editing ? 'Guardar' : 'Crear' }}</button>
          <button type="button" @click="showModal = false" class="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700">Cancelar</button>
        </div>
      </form>
    </Modal>
  </div>
</template>
