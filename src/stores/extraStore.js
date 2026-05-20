import { defineStore } from 'pinia'
import { ref } from 'vue'
import { uid, save, load, calcTotalPrice } from '../models/helpers'
import { useIngredientStore } from './ingredientStore'
import { useSupplyStore } from './supplyStore'
import { useProductStore } from './productStore'

export const useExtraStore = defineStore('extras', () => {
  const items = ref(load('extras'))

  function persist() { save('extras', items.value) }

  function calcCost(extra) {
    const ingStore = useIngredientStore()
    const supStore = useSupplyStore()
    const prodStore = useProductStore()
    let cost = 0
    for (const ing of (extra.ingredients || [])) {
      const ref = ingStore.items.find(i => i.id === ing.id)
      if (ref) cost += ref.costPerUnit * ing.qty
    }
    for (const sup of (extra.supplies || [])) {
      const ref = supStore.items.find(i => i.id === sup.id)
      if (ref) cost += ref.costPerUnit * sup.qty
    }
    for (const entry of (extra.products || [])) {
      const p = prodStore.items.find(i => i.id === entry.productId)
      if (p) cost += p.cost * entry.qty
    }
    return +cost.toFixed(2)
  }

  function add(data) {
    const item = {
      id: uid(),
      name: data.name,
      price: +data.price,
      ingredients: data.ingredients || [],
      supplies: data.supplies || [],
      products: data.products || [],
      active: true,
      createdAt: new Date().toISOString(),
    }
    items.value.push(item)
    persist()
    return item
  }

  function update(id, data) {
    const idx = items.value.findIndex(i => i.id === id)
    if (idx === -1) return
    Object.assign(items.value[idx], data)
    items.value[idx].price = +data.price
    items.value[idx].ingredients = data.ingredients || []
    items.value[idx].supplies = data.supplies || []
    items.value[idx].products = data.products || []
    persist()
  }

  function remove(id) {
    items.value = items.value.filter(i => i.id !== id)
    persist()
  }

  function toggle(id) {
    const item = items.value.find(i => i.id === id)
    if (item) { item.active = !item.active; persist() }
  }

  return { items, add, update, remove, toggle, calcCost }
})
