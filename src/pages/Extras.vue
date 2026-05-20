<script setup>
import { ref, computed } from 'vue'
import { useExtraStore } from '../stores/extraStore'
import { useIngredientStore } from '../stores/ingredientStore'
import { useSupplyStore } from '../stores/supplyStore'
import { useProductStore } from '../stores/productStore'
import { getStepForUnit, formatUnit } from '../models/helpers'
import Modal from '../components/Modal.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'

const store = useExtraStore()
const ingStore = useIngredientStore()
const supStore = useSupplyStore()
const prodStore = useProductStore()

const showModal = ref(false)
const editing = ref(null)
const expandedCards = ref(new Set())
const compactView = ref(false)

function toggleCard(id) {
  const s = new Set(expandedCards.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  expandedCards.value = s
}
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

function cardIngs(item) {
  return (item.ingredients || []).map(ing => {
    const ref = ingStore.items.find(i => i.id === ing.id)
    if (!ref) return null
    return { name: ref.name, qty: ing.qty, cost: ref.costPerUnit, unit: ref.unit, subtotal: +(ing.qty * ref.costPerUnit).toFixed(2) }
  }).filter(Boolean)
}

function cardSups(item) {
  return (item.supplies || []).map(sup => {
    const ref = supStore.items.find(s => s.id === sup.id)
    if (!ref) return null
    return { name: ref.name, qty: sup.qty, cost: ref.costPerUnit, unit: ref.unit, subtotal: +(sup.qty * ref.costPerUnit).toFixed(2) }
  }).filter(Boolean)
}

function cardProds(item) {
  return (item.products || []).map(entry => {
    const ref = prodStore.items.find(p => p.id === entry.productId)
    if (!ref) return null
    return { name: ref.name, qty: entry.qty, cost: ref.cost, unit: 'un', subtotal: +(entry.qty * ref.cost).toFixed(2) }
  }).filter(Boolean)
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <p class="text-sm text-gray-400">{{ store.items.length }} extras</p>
        <button @click="compactView = !compactView" class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors" :class="compactView ? 'bg-brand/20 text-brand' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          {{ compactView ? 'Vista completa' : 'Vista resumida' }}
        </button>
      </div>
      <button @click="openCreate" class="px-4 py-2 bg-brand text-gray-900 font-medium rounded-lg hover:bg-brand-dark transition-colors text-sm">+ Nuevo</button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="item in store.items" :key="item.id" class="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors flex flex-col h-full">
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-2 min-w-0">
            <button @click="toggleCard(item.id)" class="sm:hidden shrink-0 p-0.5 text-gray-500 hover:text-gray-300 transition-colors">
              <svg class="w-4 h-4 transition-transform" :class="expandedCards.has(item.id) ? 'rotate-90' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </button>
            <h3 class="font-semibold truncate">{{ item.name }}</h3>
          </div>
          <div class="flex items-center gap-2 shrink-0 mt-1">
            <span class="text-xs font-medium" :class="item.active ? 'text-green-400' : 'text-gray-500'">{{ item.active ? 'Activo' : 'Inactivo' }}</span>
            <button @click="store.toggle(item.id)" class="relative w-10 h-5 rounded-full transition-colors" :class="item.active ? 'bg-green-500' : 'bg-gray-700'">
              <span class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform" :class="item.active ? 'translate-x-5' : ''" />
            </button>
          </div>
        </div>

        <div v-if="!compactView" :class="expandedCards.has(item.id) ? 'flex' : 'hidden'" class="sm:flex flex-col flex-1 min-h-0 sm:overflow-visible overflow-y-auto scrollbar-thin">
          <div v-if="cardIngs(item).length" class="mb-2 text-xs">
            <p class="text-xs text-brand mb-1 font-medium">Ingredientes</p>
            <div class="grid grid-cols-[auto_1fr_auto] gap-x-2 text-xs text-gray-500 mb-0.5 px-0">
              <span>Cant.</span>
              <span>($) Costo/u.</span>
              <span class="text-right">Subtotal</span>
            </div>
            <div v-for="l in cardIngs(item)" :key="l.name" class="grid grid-cols-[auto_1fr_auto] gap-x-2 text-xs text-gray-400">
              <span class="shrink-0">x{{ l.qty }}</span>
              <span class="break-words min-w-0"><span class="text-gray-600">{{ formatUnit(l.unit, l.qty) }}</span> {{ l.name }} <span class="text-gray-600">(${{ l.cost }})</span></span>
              <span class="shrink-0 text-right">${{ l.subtotal }}</span>
            </div>
          </div>

          <div v-if="cardSups(item).length" class="mt-2 pt-2 border-t border-gray-800 mb-2 text-xs">
            <p class="text-xs text-brand mb-1 font-medium">Insumos</p>
            <div class="grid grid-cols-[auto_1fr_auto] gap-x-2 text-xs text-gray-500 mb-0.5 px-0">
              <span>Cant.</span>
              <span>($) Costo/u.</span>
              <span class="text-right">Subtotal</span>
            </div>
            <div v-for="l in cardSups(item)" :key="l.name" class="grid grid-cols-[auto_1fr_auto] gap-x-2 text-xs text-gray-400">
              <span class="shrink-0">x{{ l.qty }}</span>
              <span class="break-words min-w-0"><span class="text-gray-600">{{ formatUnit(l.unit, l.qty) }}</span> {{ l.name }} <span class="text-gray-600">(${{ l.cost }})</span></span>
              <span class="shrink-0 text-right">${{ l.subtotal }}</span>
            </div>
          </div>

          <div v-if="cardProds(item).length" class="mt-2 pt-2 border-t border-gray-800 mb-2 text-xs">
            <p class="text-xs text-brand mb-1 font-medium">Productos</p>
            <div class="grid grid-cols-[auto_1fr_auto] gap-x-2 text-xs text-gray-500 mb-0.5 px-0">
              <span>Cant.</span>
              <span>($) Costo/u.</span>
              <span class="text-right">Subtotal</span>
            </div>
            <div v-for="l in cardProds(item)" :key="l.name" class="grid grid-cols-[auto_1fr_auto] gap-x-2 text-xs text-gray-400">
              <span class="shrink-0">x{{ l.qty }}</span>
              <span class="break-words min-w-0">{{ l.name }} <span class="text-gray-600">(${{ l.cost }})</span></span>
              <span class="shrink-0 text-right">${{ l.subtotal }}</span>
            </div>
          </div>

          <div class="mt-auto">
            <div class="pt-2 border-t border-gray-800">
              <p class="text-xs text-brand mb-1 font-medium">Detalle costos:</p>
              <div class="space-y-1 text-sm">
                <div class="flex justify-between"><span class="text-gray-400">Costo Total:</span><span>${{ store.calcCost(item) }}</span></div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Margen:</span>
                  <span :class="(+item.price - store.calcCost(item)) < 0 ? 'text-red-400' : 'text-green-400'">${{ (+item.price - store.calcCost(item)).toFixed(2) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Ganancia:</span>
                  <span :class="store.calcCost(item) > 0 && ((item.price - store.calcCost(item)) / store.calcCost(item)) * 100 < 0 ? 'text-red-400' : 'text-green-400'">{{ store.calcCost(item) > 0 ? (((item.price - store.calcCost(item)) / store.calcCost(item)) * 100).toFixed(1) + '%' : '—' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-between items-center py-3 border-t border-b border-gray-800" :class="compactView ? 'mt-auto' : ''">
          <span class="text-sm text-gray-400">Venta:</span>
          <span class="text-xl font-bold text-brand">+${{ item.price }}</span>
        </div>

        <div class="flex justify-end gap-2 pt-3">
          <button @click="openEdit(item)" class="px-3 py-1.5 rounded-lg bg-blue-900/20 text-blue-400 hover:bg-blue-900/40 transition-colors flex items-center gap-1.5 text-xs font-medium" title="Editar">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
            <span>Editar extra</span>
          </button>
          <button @click="confirmRemove(item.id)" class="p-1.5 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/40 transition-colors" title="Eliminar">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
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
              <input v-model.number="ing.qty" type="number" min="0" step="any" class="w-12 text-center bg-gray-800 border border-gray-700 rounded px-1 py-0.5 text-xs text-white" />
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
              <input v-model.number="sup.qty" type="number" min="0" step="any" class="w-12 text-center bg-gray-800 border border-gray-700 rounded px-1 py-0.5 text-xs text-white" />
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
              <input v-model.number="entry.qty" type="number" min="0" step="any" class="w-12 text-center bg-gray-800 border border-gray-700 rounded px-1 py-0.5 text-xs text-white" />
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
            <span>x{{ l.qty }} <span class="text-gray-600">{{ formatUnit(l.unit, l.qty) }}</span> {{ l.name }} <span class="text-gray-600">(${{ l.cost }})</span></span>
            <span>${{ l.subtotal }}</span>
          </div>
          <div class="pt-2 border-t border-gray-700">
            <p class="text-xs text-brand mb-1 font-medium">Costos</p>
            <div class="space-y-1">
              <div class="flex justify-between"><span class="text-gray-400">Costo:</span><span>${{ formCost }}</span></div>
              <div class="flex justify-between"><span class="text-gray-400">Venta:</span><span class="text-brand">+${{ form.price }}</span></div>
              <div class="flex justify-between"><span class="text-gray-400">Margen:</span><span :class="formMargin < 0 ? 'text-red-400' : 'text-green-400'">${{ formMargin }}</span></div>
              <div class="flex justify-between">
                <span class="text-gray-400">Ganancia:</span>
                <span :class="formProfitPct !== null && formProfitPct < 0 ? 'text-red-400' : 'text-green-400'">{{ formProfitPct !== null ? formProfitPct + '%' : '—' }}</span>
              </div>
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

<style>
.scrollbar-thin::-webkit-scrollbar { width: 4px; }
.scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
.scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
</style>
