import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { uid, save, load, calcSalePrice } from '../models/helpers'
import { useIngredientStore } from './ingredientStore'
import { useSupplyStore } from './supplyStore'

export const useProductStore = defineStore('products', () => {
  const items = ref(load('products'))

  function persist() { save('products', items.value) }

  function calcCost(product) {
    const ingStore = useIngredientStore()
    const supStore = useSupplyStore()
    let cost = 0
    for (const ing of product.ingredients || []) {
      const ref = ingStore.items.find(i => i.id === ing.id)
      if (ref) cost += ref.costPerUnit * ing.qty
    }
    for (const sup of product.supplies || []) {
      const ref = supStore.items.find(i => i.id === sup.id)
      if (ref) cost += ref.costPerUnit * sup.qty
    }
    return +cost.toFixed(2)
  }

  function add(data) {
    const product = {
      id: uid(),
      name: data.name,
      description: data.description || '',
      image: data.image || '',
      profitPct: +data.profitPct,
      salePrice: +data.salePrice,
      ingredients: data.ingredients || [],
      supplies: data.supplies || [],
      active: true,
      createdAt: new Date().toISOString(),
    }
    product.cost = calcCost(product)
    if (!product.salePrice) product.salePrice = calcSalePrice(product.cost, product.profitPct)
    items.value.push(product)
    persist()
    return product
  }

  function update(id, data) {
    const idx = items.value.findIndex(i => i.id === id)
    if (idx === -1) return
    const p = items.value[idx]
    Object.assign(p, data)
    p.cost = calcCost(p)
    p.salePrice = +data.salePrice
    p.profitPct = p.cost > 0 ? +(((p.salePrice - p.cost) / p.cost) * 100).toFixed(4) : 0
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

  function recalcAll() {
    items.value.forEach(p => {
      p.cost = calcCost(p)
      p.salePrice = calcSalePrice(p.cost, p.profitPct)
    })
    persist()
  }

  function getAvailableQty(product) {
    const ingStore = useIngredientStore()
    const supStore = useSupplyStore()
    let max = Infinity
    for (const ing of (product.ingredients || [])) {
      const ref = ingStore.items.find(i => i.id === ing.id)
      if (ref && ing.qty > 0) max = Math.min(max, Math.floor(ref.stock / ing.qty))
      else if (!ref) { max = 0; break }
    }
    for (const sup of (product.supplies || [])) {
      const ref = supStore.items.find(i => i.id === sup.id)
      if (ref && sup.qty > 0) max = Math.min(max, Math.floor(ref.stock / sup.qty))
      else if (!ref) { max = 0; break }
    }
    return max === Infinity ? 0 : max
  }

  return { items, add, update, remove, toggle, recalcAll, calcCost, getAvailableQty }
})
