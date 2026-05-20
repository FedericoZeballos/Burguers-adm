import { load, save, uid } from './helpers'

const SEED_KEY = 'burger_seeded_v2'

export function seedIfEmpty() {
  if (load(SEED_KEY, false)) return

  const discounts = [
    { id: uid(), name: 'Primera compra 5%', type: '%', value: 5, active: true, createdAt: new Date().toISOString() },
    { id: uid(), name: 'Cliente frecuente 10%', type: '%', value: 10, active: true, createdAt: new Date().toISOString() },
    { id: uid(), name: 'Descuento fijo $1000', type: 'fixed', value: 1000, active: true, createdAt: new Date().toISOString() },
  ]
  save('discounts', discounts)

  save(SEED_KEY, true)
}
