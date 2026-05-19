<script setup>
import { ref } from 'vue'
import { useDiscountStore } from '../stores/discountStore'
import Modal from '../components/Modal.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'

const store = useDiscountStore()
const showModal = ref(false)
const editing = ref(null)
const confirmDelete = ref(null)
const confirmSave = ref(false)
const form = ref({ name: '', type: '%', value: 0 })

function openCreate() {
  editing.value = null
  form.value = { name: '', type: '%', value: 0 }
  showModal.value = true
}

function openEdit(item) {
  editing.value = item.id
  form.value = { name: item.name, type: item.type, value: item.value }
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
      <p class="text-sm text-gray-400">{{ store.items.length }} descuentos</p>
      <button @click="openCreate" class="px-4 py-2 bg-brand text-gray-900 font-medium rounded-lg hover:bg-brand-dark transition-colors text-sm">+ Nuevo</button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="item in store.items" :key="item.id" class="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
        <div class="flex items-start justify-between mb-3">
          <h3 class="font-semibold">{{ item.name }}</h3>
          <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="item.active ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-500'">
            {{ item.active ? 'Activo' : 'Inactivo' }}
          </span>
        </div>
        <div class="text-2xl font-bold mb-3" :class="item.type === '%' ? 'text-brand' : 'text-green-400'">
          {{ item.type === '%' ? `${item.value}%` : `$${item.value}` }}
        </div>
        <div class="flex gap-2 pt-3 border-t border-gray-800">
          <button @click="store.toggle(item.id)" class="text-xs px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700">{{ item.active ? 'Desactivar' : 'Activar' }}</button>
          <button @click="openEdit(item)" class="text-xs px-3 py-1 rounded-lg bg-brand/10 text-brand hover:bg-brand/20">Editar</button>
          <button @click="confirmRemove(item.id)" class="text-xs px-3 py-1 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/40">Eliminar</button>
        </div>
      </div>
    </div>
    <p v-if="!store.items.length" class="text-center text-gray-600 py-8">No hay descuentos. ¡Crea uno!</p>

    <ConfirmDialog :show="!!confirmDelete" title="Eliminar descuento" message="¿Eliminar este descuento? Esta acción no se puede deshacer." confirmText="Eliminar" :danger="true" @confirm="store.remove(confirmDelete); confirmDelete = null" @cancel="confirmDelete = null" />
    <ConfirmDialog :show="confirmSave" title="Guardar cambios" message="¿Confirmar los cambios en este descuento?" confirmText="Guardar" @confirm="doSave" @cancel="confirmSave = false" />
    <Modal :show="showModal" :title="editing ? 'Editar Descuento' : 'Nuevo Descuento'" @close="showModal = false">
      <form @submit.prevent="save" class="space-y-3">
        <div>
          <label class="block text-sm text-gray-400 mb-1">Nombre</label>
          <input v-model="form.name" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none" required />
        </div>
        <div>
          <label class="block text-sm text-gray-400 mb-1">Tipo</label>
          <select v-model="form.type" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none">
            <option value="%">Porcentaje (%)</option>
            <option value="fixed">Monto fijo ($)</option>
          </select>
        </div>
        <div>
          <label class="block text-sm text-gray-400 mb-1">Valor</label>
          <input v-model.number="form.value" type="number" step="0.01" min="0" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none" required />
        </div>
        <div class="flex gap-2 pt-2">
          <button type="submit" class="flex-1 px-4 py-2 bg-brand text-gray-900 font-medium rounded-lg hover:bg-brand-dark">{{ editing ? 'Guardar' : 'Crear' }}</button>
          <button type="button" @click="showModal = false" class="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700">Cancelar</button>
        </div>
      </form>
    </Modal>
  </div>
</template>
