import { defineStore } from 'pinia'
import { ref } from 'vue'
import { uid, save, load, calcTotalPrice, today } from '../models/helpers'
import { useProductStore } from './productStore'
import { useComboStore } from './comboStore'

export const useIngredientStore = defineStore('ingredients', () => {
  const items = ref(load('ingredients'))

  function persist() { save('ingredients', items.value) }

  function recalcDependants() {
    useProductStore().recalcAll()
    useComboStore().recalcAll()
  }

  function add(data) {
    const item = {
      id: uid(),
      name: data.name,
      costPerUnit: +data.costPerUnit,
      quantity: +data.quantity,
      unit: data.unit,
      purchaseDate: data.purchaseDate || today(),
      expiryDate: data.expiryDate || '',
      stock: +data.quantity,
      vendible: !!data.vendible,
      createdAt: new Date().toISOString(),
    }
    item.totalPrice = calcTotalPrice(item.costPerUnit, item.quantity)
    items.value.push(item)
    persist()
    return item
  }

  function update(id, data) {
    const idx = items.value.findIndex(i => i.id === id)
    if (idx === -1) return
    const item = items.value[idx]
    Object.assign(item, data)
    item.costPerUnit = +data.costPerUnit
    item.quantity = +data.quantity
    item.totalPrice = calcTotalPrice(item.costPerUnit, item.quantity)
    item.stock = item.quantity
    persist()
    recalcDependants()
  }

  function remove(id) {
    items.value = items.value.filter(i => i.id !== id)
    persist()
  }

  function deductStock(id, qty) {
    const item = items.value.find(i => i.id === id)
    if (item) { item.stock = Math.max(0, item.stock - qty); persist() }
  }

  return { items, add, update, remove, deductStock, persist }
})
