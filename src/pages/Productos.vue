<script setup>
import { ref, computed, watch } from 'vue'
import { useProductStore } from '../stores/productStore'
import { useIngredientStore } from '../stores/ingredientStore'
import { useSupplyStore } from '../stores/supplyStore'
import { getStepForUnit } from '../models/helpers'
import Modal from '../components/Modal.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import ProductCard from '../components/ProductCard.vue'

const store = useProductStore()
const ingStore = useIngredientStore()
const supStore = useSupplyStore()

const showModal = ref(false)
const editing = ref(null)
const confirmDeleteId = ref(null)
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

function addIngredient(id) {
  if (form.value.ingredients.find(i => i.id === id)) return
  form.value.ingredients.push({ id, qty: 1 })
}

function removeIngredient(id) {
  form.value.ingredients = form.value.ingredients.filter(i => i.id !== id)
}

function addSupply(id) {
  if (form.value.supplies.find(s => s.id === id)) return
  form.value.supplies.push({ id, qty: 1 })
}

function removeSupply(id) {
  form.value.supplies = form.value.supplies.filter(s => s.id !== id)
}

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
      <p class="text-sm text-gray-400">{{ store.items.length }} productos</p>
      <button @click="openCreate" class="px-4 py-2 bg-brand text-gray-900 font-medium rounded-lg hover:bg-brand-dark transition-colors text-sm">+ Nuevo</button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <ProductCard v-for="p in store.items" :key="p.id" :product="p" @edit="openEdit" @toggle="store.toggle" @delete="confirmDelete" />
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

        <div>
          <label class="block text-sm text-gray-400 mb-1">Ingredientes</label>
          <div class="flex flex-wrap gap-1 mb-2">
            <button v-for="ing in ingStore.items" :key="ing.id" @click.prevent="addIngredient(ing.id)"
              class="text-xs px-2 py-1 rounded-full transition-colors"
              :class="form.ingredients.find(i => i.id === ing.id) ? 'bg-brand/20 text-brand' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'"
            >{{ ing.name }} <span class="opacity-60">${{ ing.costPerUnit }}/{{ ing.unit }}</span></button>
          </div>
          <div v-for="entry in form.ingredients" :key="entry.id" class="flex items-center gap-2 mb-1">
            <span class="text-sm text-gray-300 flex-1">{{ ingStore.items.find(i => i.id === entry.id)?.name }}</span>
            <span class="text-xs text-gray-500 w-20">${{ ingStore.items.find(i => i.id === entry.id)?.costPerUnit }}/{{ ingStore.items.find(i => i.id === entry.id)?.unit }}</span>
            <input v-model.number="entry.qty" type="number" min="0" :step="getStepForUnit(ingStore.items.find(i => i.id === entry.id)?.unit || 'unidad')" class="w-20 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs" />
            <button @click.prevent="removeIngredient(entry.id)" class="text-red-400 text-xs">&times;</button>
          </div>
        </div>

        <div>
          <label class="block text-sm text-gray-400 mb-1">Insumos</label>
          <div class="flex flex-wrap gap-1 mb-2">
            <button v-for="sup in supStore.items" :key="sup.id" @click.prevent="addSupply(sup.id)"
              class="text-xs px-2 py-1 rounded-full transition-colors"
              :class="form.supplies.find(s => s.id === sup.id) ? 'bg-brand/20 text-brand' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'"
            >{{ sup.name }} <span class="opacity-60">${{ sup.costPerUnit }}/{{ sup.unit }}</span></button>
          </div>
          <div v-for="entry in form.supplies" :key="entry.id" class="flex items-center gap-2 mb-1">
            <span class="text-sm text-gray-300 flex-1">{{ supStore.items.find(i => i.id === entry.id)?.name }}</span>
            <span class="text-xs text-gray-500 w-20">${{ supStore.items.find(i => i.id === entry.id)?.costPerUnit }}/{{ supStore.items.find(i => i.id === entry.id)?.unit }}</span>
            <input v-model.number="entry.qty" type="number" min="0" :step="getStepForUnit(supStore.items.find(i => i.id === entry.id)?.unit || 'unidad')" class="w-20 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs" />
            <button @click.prevent="removeSupply(entry.id)" class="text-red-400 text-xs">&times;</button>
          </div>
        </div>

        <div class="bg-gray-800 rounded-lg p-3 text-sm space-y-1">
          <div v-for="entry in form.ingredients" :key="entry.id" class="flex justify-between text-xs text-gray-500">
            <span>{{ ingStore.items.find(i => i.id === entry.id)?.name }} x{{ entry.qty }}</span>
            <span>${{ ((ingStore.items.find(i => i.id === entry.id)?.costPerUnit || 0) * entry.qty).toFixed(2) }}</span>
          </div>
          <div v-for="entry in form.supplies" :key="entry.id" class="flex justify-between text-xs text-gray-500">
            <span>{{ supStore.items.find(i => i.id === entry.id)?.name }} x{{ entry.qty }}</span>
            <span>${{ ((supStore.items.find(i => i.id === entry.id)?.costPerUnit || 0) * entry.qty).toFixed(2) }}</span>
          </div>
          <div class="flex justify-between pt-1 border-t border-gray-700"><span class="text-gray-400">Costo total:</span><span>${{ previewCost }}</span></div>
          <div class="flex justify-between"><span class="text-gray-400">Ganancia:</span><span class="text-green-400">{{ previewCost > 0 ? ((salePrice / previewCost - 1) * 100).toFixed(2) : 0 }}%</span></div>
          <div class="flex justify-between"><span class="text-gray-400">Precio venta:</span><span class="text-brand font-semibold">${{ salePrice }}</span></div>
        </div>

        <div class="flex gap-2 pt-2">
          <button type="submit" class="flex-1 px-4 py-2 bg-brand text-gray-900 font-medium rounded-lg hover:bg-brand-dark">{{ editing ? 'Guardar' : 'Crear' }}</button>
          <button type="button" @click="showModal = false" class="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700">Cancelar</button>
        </div>
      </form>
    </Modal>
  </div>
</template>
