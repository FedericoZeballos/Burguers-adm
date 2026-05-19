<script setup>
defineProps({ show: Boolean, title: String })
const emit = defineEmits(['close'])
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/60" @click="emit('close')" />
      <div class="relative bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" @click.stop>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">{{ title }}</h2>
          <button @click="emit('close')" class="text-gray-500 hover:text-white p-1">&times;</button>
        </div>
        <slot />
      </div>
    </div>
  </Teleport>
</template>
