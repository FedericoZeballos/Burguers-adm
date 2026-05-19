import { defineStore } from 'pinia'
import { ref } from 'vue'
import { uid, save, load, calcSalePrice } from '../models/helpers'
import { useProductStore } from './productStore'

export const useComboStore = defineStore('combos', () => {
  const items = ref(load('combos'))

  function persist() { save('combos', items.value) }

  function calcComboCost(products) {
    const pStore = useProductStore()
    let cost = 0
    for (const entry of products || []) {
      const p = pStore.items.find(i => i.id === entry.productId)
      if (p) cost += p.cost * entry.qty
    }
    return +cost.toFixed(2)
  }

  function calcComboProfit(products, salePrice) {
    const cost = calcComboCost(products)
    if (cost === 0) return 0
    return +(((salePrice - cost) / cost) * 100).toFixed(1)
  }

  function add(data) {
    const combo = {
      id: uid(),
      name: data.name,
      products: data.products || [],
      salePrice: +data.salePrice,
      startDate: data.startDate || '',
      endDate: data.endDate || '',
      active: true,
      createdAt: new Date().toISOString(),
    }
    combo.cost = calcComboCost(combo.products)
    combo.profitPct = calcComboProfit(combo.products, combo.salePrice)
    combo.profitMoney = +(combo.salePrice - combo.cost).toFixed(2)
    items.value.push(combo)
    persist()
    return combo
  }

  function update(id, data) {
    const idx = items.value.findIndex(i => i.id === id)
    if (idx === -1) return
    const c = items.value[idx]
    Object.assign(c, data)
    c.salePrice = +data.salePrice
    c.cost = calcComboCost(c.products)
    c.profitPct = calcComboProfit(c.products, c.salePrice)
    c.profitMoney = +(c.salePrice - c.cost).toFixed(2)
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
    items.value.forEach(c => {
      c.cost = calcComboCost(c.products)
      c.profitPct = calcComboProfit(c.products, c.salePrice)
      c.profitMoney = +(c.salePrice - c.cost).toFixed(2)
    })
    persist()
  }

  function getAvailableQty(combo) {
    const pStore = useProductStore()
    let max = Infinity
    for (const entry of (combo.products || [])) {
      const p = pStore.items.find(i => i.id === entry.productId)
      if (!p) { max = 0; break }
      const avail = pStore.getAvailableQty(p)
      if (entry.qty > 0) max = Math.min(max, Math.floor(avail / entry.qty))
      else { max = 0; break }
    }
    return max === Infinity ? 0 : max
  }

  return { items, add, update, remove, toggle, recalcAll, calcComboCost, getAvailableQty }
})
