const STORAGE_PREFIX = 'burger_'

export function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export function save(key, data) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data))
  } catch (e) {
    console.warn('Storage save failed', e)
  }
}

export function load(key, fallback = []) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function today() {
  return new Date().toISOString().slice(0, 10)
}

export function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export function daysUntil(dateStr) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24))
}

export function isExpired(dateStr) {
  return daysUntil(dateStr) < 0
}

export function isNearExpiry(dateStr, days = 7) {
  const d = daysUntil(dateStr)
  return d >= 0 && d <= days
}

export function calcCostPerUnit(price, qty) {
  return qty > 0 ? +(price / qty).toFixed(2) : 0
}

export function calcTotalPrice(costPerUnit, qty) {
  return +(costPerUnit * qty).toFixed(2)
}

export function getStepForUnit(unit) {
  if (unit === 'kg' || unit === 'l' || unit === 'g' || unit === 'ml') return 0.1
  return 1
}

export function formatUnit(unit, qty) {
  if (unit === 'unidad') return qty > 1 ? 'uds.' : 'ud.'
  return unit
}

export function calcSalePrice(cost, profitPct) {
  return +(cost * (1 + profitPct / 100)).toFixed(2)
}

export function calcSubtotal(price, qty) {
  return +(price * qty).toFixed(2)
}

export function calcDiscount(subtotal, type, value) {
  if (type === '%') return +(subtotal * value / 100).toFixed(2)
  return +Math.min(value, subtotal).toFixed(2)
}
