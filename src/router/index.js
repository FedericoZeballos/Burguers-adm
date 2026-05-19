import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'Dashboard', component: () => import('../pages/Dashboard.vue') },
  { path: '/ingredientes', name: 'Ingredientes', component: () => import('../pages/Ingredientes.vue') },
  { path: '/insumos', name: 'Insumos', component: () => import('../pages/Insumos.vue') },
  { path: '/productos', name: 'Productos', component: () => import('../pages/Productos.vue') },
  { path: '/extras', name: 'Extras', component: () => import('../pages/Extras.vue') },
  { path: '/combos', name: 'Combos', component: () => import('../pages/Combos.vue') },
  { path: '/descuentos', name: 'Descuentos', component: () => import('../pages/Descuentos.vue') },
  { path: '/ventas', name: 'Ventas', component: () => import('../pages/Ventas.vue') },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
