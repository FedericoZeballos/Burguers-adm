import { defineStore } from 'pinia'
import { ref } from 'vue'
import { uid, save, load, today, calcSubtotal, calcDiscount } from '../models/helpers'
import { useIngredientStore } from './ingredientStore'
import { useSupplyStore } from './supplyStore'
import { useProductStore } from './productStore'
import { useComboStore } from './comboStore'
import { useExtraStore } from './extraStore'

export const useSalesStore = defineStore('sales', () => {
  const items = ref(load('sales'))

  function persist() { save('sales', items.value) }

  function deductStock(lines) {
    const ingStore = useIngredientStore()
    const supStore = useSupplyStore()
    const prodStore = useProductStore()
    const comboStore = useComboStore()
    const extraStore = useExtraStore()

    for (const line of lines) {
      if (line.type === 'product') {
        const prod = prodStore.items.find(p => p.id === line.productId)
        if (!prod) continue
        for (const ing of (prod.ingredients || [])) {
          const item = ingStore.items.find(i => i.id === ing.id)
          if (item) item.stock = Math.max(0, +(item.stock - ing.qty * line.qty).toFixed(4))
        }
        for (const sup of (prod.supplies || [])) {
          const item = supStore.items.find(s => s.id === sup.id)
          if (item) item.stock = Math.max(0, +(item.stock - sup.qty * line.qty).toFixed(4))
        }
        for (const extra of (line.extras || [])) {
          const extraDef = extraStore.items.find(e => e.id === extra.id)
          if (!extraDef) continue
          for (const sup of (extraDef.supplies || [])) {
            const item = supStore.items.find(s => s.id === sup.id)
            if (item) item.stock = Math.max(0, +(item.stock - sup.qty * extra.qty).toFixed(4))
          }
        }
      } else if (line.type === 'combo') {
        const combo = comboStore.items.find(c => c.id === line.productId)
        if (!combo) continue
        for (const entry of (combo.products || [])) {
          const prod = prodStore.items.find(p => p.id === entry.productId)
          if (!prod) continue
          const factor = entry.qty * line.qty
          for (const ing of (prod.ingredients || [])) {
            const item = ingStore.items.find(i => i.id === ing.id)
            if (item) item.stock = Math.max(0, +(item.stock - ing.qty * factor).toFixed(4))
          }
          for (const sup of (prod.supplies || [])) {
            const item = supStore.items.find(s => s.id === sup.id)
            if (item) item.stock = Math.max(0, +(item.stock - sup.qty * factor).toFixed(4))
          }
        }
      }
    }

    ingStore.persist()
    supStore.persist()
  }

  function add(data) {
    let total = 0
    const lines = (data.lines || []).map(line => {
      const sub = calcSubtotal(line.unitPrice, line.qty)
      const extraSub = (line.extras || []).reduce((s, e) => s + e.price * e.qty, 0)
      const subTotal = sub + extraSub
      total += subTotal
      return { ...line, subtotal: sub, extraSubtotal: extraSub, lineTotal: subTotal }
    })

    const discounts = data.discounts || []
    let totalDiscount = 0
    let remaining = total
    for (const d of discounts) {
      const amt = calcDiscount(remaining, d.type, d.value)
      totalDiscount += amt
      remaining -= amt
    }

    const sale = {
      id: uid(),
      date: today(),
      lines,
      discounts,
      discountAmount: +totalDiscount.toFixed(2),
      subtotal: +total.toFixed(2),
      total: +(total - totalDiscount).toFixed(2),
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
    }
    items.value.push(sale)
    persist()

    deductStock(lines)

    return sale
  }

  function remove(id) {
    items.value = items.value.filter(i => i.id !== id)
    persist()
  }

  return { items, add, remove }
})
