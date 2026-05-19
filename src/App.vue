<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const sidebarOpen = ref(false)

const nav = [
  { name: 'Dashboard', path: '/', icon: '📊' },
  { name: 'Ingredientes', path: '/ingredientes', icon: '🥩' },
  { name: 'Insumos', path: '/insumos', icon: '📦' },
  { name: 'Productos', path: '/productos', icon: '🍔' },
  { name: 'Extras', path: '/extras', icon: '➕' },
  { name: 'Combos', path: '/combos', icon: '🎯' },
  { name: 'Descuentos', path: '/descuentos', icon: '🏷️' },
  { name: 'Ventas', path: '/ventas', icon: '🧾' },
]

const currentTitle = computed(() => nav.find(n => n.path === route.path)?.name || '')
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-gray-950">
    <aside
      class="fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 border-r border-gray-800 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:inset-auto"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex items-center h-16 px-6 border-b border-gray-800">
        <span class="text-2xl font-bold text-brand">🍔 Burger</span>
        <span class="text-sm text-gray-400 ml-1">Manager</span>
      </div>
      <nav class="p-4 space-y-1">
        <button
          v-for="n in nav"
          :key="n.path"
          @click="router.push(n.path); sidebarOpen = false"
          class="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          :class="route.path === n.path ? 'bg-brand/10 text-brand' : 'text-gray-400 hover:text-white hover:bg-gray-800'"
        >
          <span>{{ n.icon }}</span>
          <span>{{ n.name }}</span>
        </button>
      </nav>
    </aside>
    <div v-if="sidebarOpen" class="fixed inset-0 z-30 bg-black/50 lg:hidden" @click="sidebarOpen = false" />

    <div class="flex-1 flex flex-col min-w-0">
      <header class="h-16 border-b border-gray-800 flex items-center justify-between px-4 lg:px-6 bg-gray-900/50 backdrop-blur">
        <div class="flex items-center gap-3">
          <button @click="sidebarOpen = true" class="lg:hidden text-gray-400 hover:text-white p-1">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <h1 class="text-lg font-semibold">{{ currentTitle }}</h1>
        </div>
        <div class="text-sm text-gray-500">{{ new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }) }}</div>
      </header>
      <main class="flex-1 overflow-y-auto p-4 lg:p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>
