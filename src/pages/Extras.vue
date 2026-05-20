<script setup>
import { ref, computed } from 'vue'
import { useExtraStore } from '../stores/extraStore'
import { useIngredientStore } from '../stores/ingredientStore'
import { useSupplyStore } from '../stores/supplyStore'
import { useProductStore } from '../stores/productStore'
import Modal from '../components/Modal.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'

const store = useExtraStore()
const ingStore = useIngredientStore()
const supStore = useSupplyStore()
const prodStore = useProductStore()

const showModal = ref(false)
const editing = ref(null)
const confirmDelete = ref(null)
const confirmSave = ref(false)
const form = ref({ name: '', price: 0, ingredients: [], supplies: [], products: [] })

const ingOptions = computed(() => ingStore.items.map(i => ({ id: i.id, name: i.name, cost: i.costPerUnit, unit: i.unit })))
const supOptions = computed(() => supStore.items.map(s => ({ id: s.id, name: s.name, cost: s.costPerUnit, unit: s.unit })))
const prodOptions = computed(() => prodStore.items.filter(p => p.active).map(p => ({ id: p.id, name: p.name, cost: p.cost })))

const formLines = computed(() => {
  const lines = []
  for (const ing of form.value.ingredients) {
    const ref = ingStore.items.find(i => i.id === ing.id)
    lines.push({ name: ref ? ref.name : '?', qty: ing.qty, cost: ref ? ref.costPerUnit : 0, unit: ref ? ref.unit : '', subtotal: +(ing.qty * (ref ? ref.costPerUnit : 0)).toFixed(2), type: 'ingrediente' })
  }
  for (const sup of form.value.supplies) {
    const ref = supStore.items.find(s => s.id === sup.id)
    lines.push({ name: ref ? ref.name : '?', qty: sup.qty, cost: ref ? ref.costPerUnit : 0, unit: ref ? ref.unit : '', subtotal: +(sup.qty * (ref ? ref.costPerUnit : 0)).toFixed(2), type: 'insumo' })
  }
  for (const entry of form.value.products) {
    const ref = prodStore.items.find(p => p.id === entry.productId)
    lines.push({ name: ref ? ref.name : '?', qty: entry.qty, cost: ref ? ref.cost : 0, unit: 'un', subtotal: +(entry.qty * (ref ? ref.cost : 0)).toFixed(2), type: 'producto' })
  }
  return lines
})

const formCost = computed(() => +formLines.value.reduce((s, l) => s + l.subtotal, 0).toFixed(2))
const formMargin = computed(() => +((form.value.price || 0) - formCost.value).toFixed(2))
const formProfitPct = computed(() => {
  if (formCost.value <= 0) return null
  return +(((form.value.price - formCost.value) / formCost.value) * 100).toFixed(1)
})

function resolveIngName(id) { return ingStore.items.find(i => i.id === id)?.name || '?' }
function resolveSupName(id) { return supStore.items.find(s => s.id === id)?.name || '?' }
function resolveProdName(id) { return prodStore.items.find(p => p.id === id)?.name || '?' }

const ingToAdd = ref('')
const supToAdd = ref('')
const prodToAdd = ref('')

function addIng() {
  if (!ingToAdd.value) return
  const id = ingToAdd.value
  const existing = form.value.ingredients.find(i => i.id === id)
  if (existing) existing.qty++
  else form.value.ingredients.push({ id, qty: 1 })
  ingToAdd.value = ''
}
function incIng(idx) { form.value.ingredients[idx].qty++ }
function decIng(idx) {
  if (form.value.ingredients[idx].qty > 1) form.value.ingredients[idx].qty--
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
function incSup(idx) { form.value.supplies[idx].qty++ }
function decSup(idx) {
  if (form.value.supplies[idx].qty > 1) form.value.supplies[idx].qty--
}
function removeSup(idx) { form.value.supplies.splice(idx, 1) }

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

function openCreate() {
  editing.value = null
  form.value = { name: '', price: 0, ingredients: [], supplies: [], products: [] }
  showModal.value = true
}

function openEdit(item) {
  editing.value = item.id
  form.value = { name: item.name, price: item.price, ingredients: (item.ingredients || []).map(i => ({ ...i })), supplies: (item.supplies || []).map(s => ({ ...s })), products: (item.products || []).map(p => ({ ...p })) }
  showModal.value = true
}

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

function confirmRemove(id) { confirmDelete.value = id }

function cardLines(item) {
  const lines = []
  for (const ing of (item.ingredients || [])) {
    const ref = ingStore.items.find(i => i.id === ing.id)
    if (ref) lines.push({ name: ref.name, qty: ing.qty, cost: ref.costPerUnit, unit: ref.unit, subtotal: +(ing.qty * ref.costPerUnit).toFixed(2) })
  }
  for (const sup of (item.supplies || [])) {
    const ref = supStore.items.find(s => s.id === sup.id)
    if (ref) lines.push({ name: ref.name, qty: sup.qty, cost: ref.costPerUnit, unit: ref.unit, subtotal: +(sup.qty * ref.costPerUnit).toFixed(2) })
  }
  for (const entry of (item.products || [])) {
    const ref = prodStore.items.find(p => p.id === entry.productId)
    if (ref) lines.push({ name: ref.name, qty: entry.qty, cost: ref.cost, unit: 'un', subtotal: +(entry.qty * ref.cost).toFixed(2) })
  }
  return lines
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <p class="text-sm text-gray-400">{{ store.items.length }} extras</p>
      <button @click="openCreate" class="px-4 py-2 bg-brand text-gray-900 font-medium rounded-lg hover:bg-brand-dark transition-colors text-sm">+ Nuevo</button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="item in store.items" :key="item.id" class="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
        <div class="flex items-start justify-between mb-3">
          <div><h3 class="font-semibold">{{ item.name }}</h3></div>
          <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="item.active ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-500'">
            {{ item.active ? 'Activo' : 'Inactivo' }}
          </span>
        </div>

        <div v-if="cardLines(item).length" class="space-y-0.5 mb-2 text-xs">
          <div v-for="l in cardLines(item)" :key="l.name + l.qty" class="flex justify-between text-gray-400">
            <span>{{ l.name }} <span class="text-gray-600">x{{ l.qty }} (${{ l.cost }}/{{ l.unit }})</span></span>
            <span class="text-gray-300">${{ l.subtotal }}</span>
          </div>
        </div>

        <div class="space-y-1 text-sm pt-2 border-t border-gray-800">
          <div class="flex justify-between"><span class="text-gray-400">Costo:</span><span>${{ store.calcCost(item) }}</span></div>
          <div class="flex justify-between"><span class="text-gray-400">Margen:</span><span class="text-green-400">${{ (+item.price - store.calcCost(item)).toFixed(2) }}</span></div>
          <div class="flex justify-between">
            <span class="text-gray-400">Ganancia:</span>
            <span class="text-green-400">{{ store.calcCost(item) > 0 ? (((item.price - store.calcCost(item)) / store.calcCost(item)) * 100).toFixed(1) + '%' : '—' }}</span>
          </div>
        </div>

        <div class="flex justify-between items-center mt-3 pt-3 border-t border-gray-800">
          <span class="text-sm text-gray-400">Venta:</span>
          <span class="text-xl font-bold text-brand">+${{ item.price }}</span>
        </div>

        <div class="flex gap-2 mt-3 pt-3 border-t border-gray-800">
          <button @click="store.toggle(item.id)" class="text-xs px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700">{{ item.active ? 'Desactivar' : 'Activar' }}</button>
          <button @click="openEdit(item)" class="text-xs px-3 py-1 rounded-lg bg-brand/10 text-brand hover:bg-brand/20">Editar</button>
          <button @click="confirmRemove(item.id)" class="text-xs px-3 py-1 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/40">Eliminar</button>
        </div>
      </div>
    </div>
    <p v-if="!store.items.length" class="text-center text-gray-600 py-8">No hay extras. ¡Crea uno!</p>

    <ConfirmDialog :show="!!confirmDelete" title="Eliminar extra" message="¿Eliminar este extra? Esta acción no se puede deshacer." confirmText="Eliminar" :danger="true" @confirm="store.remove(confirmDelete); confirmDelete = null" @cancel="confirmDelete = null" />
    <ConfirmDialog :show="confirmSave" title="Guardar cambios" message="¿Confirmar los cambios en este extra?" confirmText="Guardar" @confirm="doSave" @cancel="confirmSave = false" />

    <Modal :show="showModal" :title="editing ? 'Editar Extra' : 'Nuevo Extra'" @close="showModal = false">
      <form @submit.prevent="save" class="space-y-4">
        <div>
          <label class="block text-sm text-gray-400 mb-1">Nombre</label>
          <input v-model="form.name" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none" required />
        </div>

        <div class="bg-gray-800/50 rounded-lg p-3">
          <p class="text-sm font-semibold text-gray-300 mb-3">Ingredientes</p>
          <select v-model="ingToAdd" @change="addIng" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs focus:border-brand outline-none">
            <option value="">Agregar ingrediente...</option>
            <option v-for="i in ingOptions" :key="i.id" :value="i.id">{{ i.name }}</option>
          </select>
          <div v-for="(ing, idx) in form.ingredients" :key="ing.id" class="flex items-center justify-between text-xs text-gray-400 py-1 mt-1">
            <div class="flex items-center gap-1">
              <button type="button" @click="decIng(idx)" class="w-5 h-5 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600">−</button>
              <span class="w-4 text-center text-white">{{ ing.qty }}</span>
              <button type="button" @click="incIng(idx)" class="w-5 h-5 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600">+</button>
              <span class="ml-2">{{ resolveIngName(ing.id) }} <span class="text-gray-600">(${{ ingStore.items.find(i => i.id === ing.id)?.costPerUnit }}/{{ ingStore.items.find(i => i.id === ing.id)?.unit }})</span></span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-gray-300">${{ +(ing.qty * (ingStore.items.find(i => i.id === ing.id)?.costPerUnit || 0)).toFixed(2) }}</span>
              <button type="button" @click="removeIng(idx)" class="w-5 h-5 flex items-center justify-center rounded bg-gray-700 text-xs text-red-400 hover:bg-red-900/40 hover:text-red-300">&times;</button>
            </div>
          </div>
        </div>

        <div class="bg-gray-800/50 rounded-lg p-3">
          <p class="text-sm font-semibold text-gray-300 mb-3">Insumos</p>
          <select v-model="supToAdd" @change="addSup" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs focus:border-brand outline-none">
            <option value="">Agregar insumo...</option>
            <option v-for="s in supOptions" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
          <div v-for="(sup, idx) in form.supplies" :key="sup.id" class="flex items-center justify-between text-xs text-gray-400 py-1 mt-1">
            <div class="flex items-center gap-1">
              <button type="button" @click="decSup(idx)" class="w-5 h-5 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600">−</button>
              <span class="w-4 text-center text-white">{{ sup.qty }}</span>
              <button type="button" @click="incSup(idx)" class="w-5 h-5 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600">+</button>
              <span class="ml-2">{{ resolveSupName(sup.id) }} <span class="text-gray-600">(${{ supStore.items.find(s => s.id === sup.id)?.costPerUnit }}/{{ supStore.items.find(s => s.id === sup.id)?.unit }})</span></span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-gray-300">${{ +(sup.qty * (supStore.items.find(s => s.id === sup.id)?.costPerUnit || 0)).toFixed(2) }}</span>
              <button type="button" @click="removeSup(idx)" class="w-5 h-5 flex items-center justify-center rounded bg-gray-700 text-xs text-red-400 hover:bg-red-900/40 hover:text-red-300">&times;</button>
            </div>
          </div>
        </div>

        <div class="bg-gray-800/50 rounded-lg p-3">
          <p class="text-sm font-semibold text-gray-300 mb-3">Productos</p>
          <select v-model="prodToAdd" @change="addProd" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs focus:border-brand outline-none">
            <option value="">Agregar producto...</option>
            <option v-for="p in prodOptions" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
          <div v-for="(entry, idx) in form.products" :key="entry.productId" class="flex items-center justify-between text-xs text-gray-400 py-1 mt-1">
            <div class="flex items-center gap-1">
              <button type="button" @click="decProd(idx)" class="w-5 h-5 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600">−</button>
              <span class="w-4 text-center text-white">{{ entry.qty }}</span>
              <button type="button" @click="incProd(idx)" class="w-5 h-5 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600">+</button>
              <span class="ml-2">{{ resolveProdName(entry.productId) }} <span class="text-gray-600">(${{ prodStore.items.find(p => p.id === entry.productId)?.cost }}/un)</span></span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-gray-300">${{ +(entry.qty * (prodStore.items.find(p => p.id === entry.productId)?.cost || 0)).toFixed(2) }}</span>
              <button type="button" @click="removeProd(idx)" class="w-5 h-5 flex items-center justify-center rounded bg-gray-700 text-xs text-red-400 hover:bg-red-900/40 hover:text-red-300">&times;</button>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-sm text-gray-400 mb-1">Precio venta</label>
          <input v-model.number="form.price" type="number" step="0.01" min="0" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-brand outline-none" />
        </div>

        <div v-if="formLines.length" class="bg-gray-800 border border-brand/10 rounded-lg p-3 text-sm space-y-1">
          <div v-for="l in formLines" :key="l.name" class="flex justify-between text-xs text-gray-400">
            <span>{{ l.name }} <span class="text-gray-600">x{{ l.qty }} (${{ l.cost }}/{{ l.unit }})</span></span>
            <span>${{ l.subtotal }}</span>
          </div>
          <div class="border-t border-gray-700 pt-1 flex justify-between"><span class="text-gray-400">Costo:</span><span>${{ formCost }}</span></div>
          <div class="flex justify-between"><span class="text-gray-400">Venta:</span><span class="text-brand">+${{ form.price }}</span></div>
          <div class="flex justify-between"><span class="text-gray-400">Margen:</span><span class="text-green-400">${{ formMargin }}</span></div>
          <div class="flex justify-between">
            <span class="text-gray-400">Ganancia:</span>
            <span class="text-green-400">{{ formProfitPct !== null ? formProfitPct + '%' : '—' }}</span>
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
