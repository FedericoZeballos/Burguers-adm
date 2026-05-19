import { defineStore } from 'pinia'
import { ref } from 'vue'
import { uid, save, load } from '../models/helpers'

export const useExtraStore = defineStore('extras', () => {
  const items = ref(load('extras'))

  function persist() { save('extras', items.value) }

  function add(data) {
    const item = {
      id: uid(),
      name: data.name,
      type: data.type,
      refId: data.refId || '',
      price: +data.price,
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

  return { items, add, update, remove, toggle }
})
