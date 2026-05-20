<script setup>
import { ref } from 'vue'
import { useIngredientStore } from '../stores/ingredientStore'
import { formatDate, isExpired, isNearExpiry, getStepForUnit } from '../models/helpers'
import Modal from '../components/Modal.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'

const store = useIngredientStore()
const showModal = ref(false)
const editing = ref(null)
const confirmDelete = ref(null)
const confirmSave = ref(false)

function stockClass(stock) {
  if (stock <= 0) return 'text-red-400 font-semibold'
  if (stock <= 5) return 'text-yellow-400 font-semibold'
  return 'text-green-400'
}

const form = ref({ name: '', costPerUnit: 0, quantity: 0, unit: 'unidad', purchaseDate: '', expiryDate: '', vendible: false })

function openCreate() {
  editing.value = null
  form.value = { name: '', costPerUnit: 0, quantity: 0, unit: 'unidad', purchaseDate: new Date().toISOString().slice(0, 10), expiryDate: '', vendible: false }
  showModal.value = true
}

function openEdit(item) {
  editing.value = item.id
  form.value = { ...item, quantity: item.stock }
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

function confirmRemove(id) {
  confirmDelete.value = id
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <p class="text-sm text-gray-400">{{ store.items.length }} ingredientes</p>
      <button @click="openCreate" class="px-4 py-2 bg-brand text-gray-900 font-medium rounded-lg hover:bg-brand-dark transition-colors text-sm">+ Nuevo</button>
    </div>

    <div class="grid gap-3">
      <div v-for="item in store.items" :key="item.id"
        class="bg-gray-900 border rounded-xl p-4 transition-colors"
        :class="isExpired(item.expiryDate) ? 'border-red-800/50' : isNearExpiry(item.expiryDate) ? 'border-yellow-800/50' : 'border-gray-800 hover:border-gray-700'"
      >
        <div class="flex items-start justify-between mb-2">
          <div>
            <h3 class="font-semibold flex items-center gap-2">
              {{ item.name }}
              <span v-if="item.vendible" class="text-xs bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded-full">Vendible</span>
              <span v-if="isExpired(item.expiryDate)" class="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded-full">Vencido</span>
              <span v-else-if="isNearExpiry(item.expiryDate)" class="text-xs bg-yellow-900/50 text-yellow-400 px-2 py-0.5 rounded-full">Próximo a vencer</span>
            </h3>
          </div>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-gray-400">
          <div><span class="text-gray-600">Costo {{ item.unit }}:</span> ${{ item.costPerUnit }}</div>
          <div><span class="text-gray-600">Stock:</span><span :class="stockClass(item.stock)"> {{ item.stock }} {{ item.unit }}</span></div>
          <div><span class="text-gray-600">Total:</span> ${{ item.totalPrice }}</div>
          <div><span class="text-gray-600">Vence:</span> {{ formatDate(item.expiryDate) }}</div>
        </div>
        <div class="flex gap-2 mt-3 pt-3 border-t border-gray-800">
          <button @click="openEdit(item)" class="px-3 py-1.5 rounded-lg bg-blue-900/20 text-blue-400 hover:bg-blue-900/40 transition-colors flex items-center gap-1.5 text-xs font-medium">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
            <span>Editar ingrediente</span>
          </button>
          <button @click="confirmRemove(item.id)" class="text-xs px-3 py-1 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/40">Eliminar</button>
        </div>
      </div>
      <p v-if="!store.items.length" class="text-center text-gray-600 py-8">No hay ingredientes. ¡Crea uno!</p>
    </div>

    <ConfirmDialog :show="!!confirmDelete" title="Eliminar ingrediente" message="¿Eliminar este ingrediente? Esta acción no se puede deshacer." confirmText="Eliminar" :danger="true" @confirm="store.remove(confirmDelete); confirmDelete = null" @cancel="confirmDelete = null" />
    <ConfirmDialog :show="confirmSave" title="Guardar cambios" message="¿Confirmar los cambios en este ingrediente?" confirmText="Guardar" @confirm="doSave" @cancel="confirmSave = false" />
    <Modal :show="showModal" :title="editing ? 'Editar Ingrediente' : 'Nuevo Ingrediente'" @close="showModal = false">
      <form @submit.prevent="save" class="space-y-4">
        <div>
          <label class="block text-sm text-gray-400 mb-1">Nombre</label>
          <input v-model="form.name" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none" required />
        </div>

        <div class="bg-gray-800/50 rounded-lg p-3">
          <p class="text-sm font-semibold text-gray-300 mb-3">Costo y stock</p>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm text-gray-400 mb-1">Precio de costo por {{ form.unit }}</label>
              <input v-model.number="form.costPerUnit" type="number" step="0.01" min="0" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none" required />
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">Stock</label>
              <input v-model.number="form.quantity" type="number" :step="getStepForUnit(form.unit)" min="0" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none" required />
            </div>
          </div>
          <div class="mt-3">
            <label class="block text-sm text-gray-400 mb-1">Unidad</label>
            <select v-model="form.unit" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none">
              <option value="kg">kg</option><option value="g">g</option><option value="l">l</option><option value="ml">ml</option><option value="unidad">unidad</option>
            </select>
          </div>
        </div>

        <div class="bg-gray-800 border border-brand/10 rounded-lg p-3 text-sm flex justify-between">
          <span class="text-gray-400">Precio total:</span>
          <span class="text-brand font-semibold">${{ (form.costPerUnit * form.quantity).toFixed(2) }}</span>
        </div>
        <div class="bg-gray-800/50 rounded-lg p-3">
          <p class="text-sm font-semibold text-gray-300 mb-3">Fechas</p>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm text-gray-400 mb-1">Fecha compra</label>
              <input v-model="form.purchaseDate" type="date" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none" />
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">Fecha vencimiento</label>
              <input v-model="form.expiryDate" type="date" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none" />
            </div>
          </div>
        </div>

        <label class="flex items-center gap-2 text-sm cursor-pointer bg-gray-800/50 rounded-lg p-3">
          <input v-model="form.vendible" type="checkbox" class="rounded border-gray-600 bg-gray-800 text-brand focus:ring-brand" />
          <span>Vendible (se puede vender individualmente)</span>
        </label>
        <div class="flex gap-2 pt-2">
          <button type="submit" class="flex-1 px-4 py-2 bg-brand text-gray-900 font-medium rounded-lg hover:bg-brand-dark transition-colors text-sm">{{ editing ? 'Guardar' : 'Crear' }}</button>
          <button type="button" @click="showModal = false" class="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-sm">Cancelar</button>
        </div>
      </form>
    </Modal>
  </div>
</template>
