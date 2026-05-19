<script setup>
import { ref, watch } from 'vue'

const props = defineProps({ show: Boolean, title: { type: String, default: 'Confirmar' }, message: { type: String, default: '¿Estás seguro?' }, confirmText: { type: String, default: 'Confirmar' }, danger: Boolean })
const emit = defineEmits(['confirm', 'cancel'])
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-[60] flex items-center justify-center p-4" @click.self="emit('cancel')">
      <div class="fixed inset-0 bg-black/60" />
      <div class="relative bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-sm p-6">
        <h3 class="text-lg font-semibold mb-2">{{ title }}</h3>
        <p class="text-sm text-gray-400 mb-6">{{ message }}</p>
        <div class="flex gap-2">
          <button @click="emit('confirm')" class="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors" :class="danger ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-brand text-gray-900 hover:bg-brand-dark'">{{ confirmText }}</button>
          <button @click="emit('cancel')" class="flex-1 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 text-sm">Cancelar</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
