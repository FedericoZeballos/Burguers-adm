import { load, save, uid, today, calcTotalPrice, calcSalePrice } from './helpers'

const SEED_KEY = 'burger_seeded_v2'

export function seedIfEmpty() {
  if (load(SEED_KEY, false)) return

  const ingredients = [
    { id: uid(), name: 'Carne de res', costPerUnit: 500, quantity: 10, unit: 'kg', purchaseDate: '2026-05-01', expiryDate: '2026-06-01', stock: 10, vendible: false, totalPrice: 5000, createdAt: new Date().toISOString() },
    { id: uid(), name: 'Pan', costPerUnit: 40, quantity: 50, unit: 'unidad', purchaseDate: '2026-05-15', expiryDate: '2026-05-25', stock: 50, vendible: false, totalPrice: 2000, createdAt: new Date().toISOString() },
    { id: uid(), name: 'Cheddar', costPerUnit: 600, quantity: 5, unit: 'kg', purchaseDate: '2026-05-10', expiryDate: '2026-06-10', stock: 5, vendible: true, totalPrice: 3000, createdAt: new Date().toISOString() },
    { id: uid(), name: 'Panceta', costPerUnit: 833.33, quantity: 3, unit: 'kg', purchaseDate: '2026-05-12', expiryDate: '2026-06-05', stock: 3, vendible: true, totalPrice: 2500, createdAt: new Date().toISOString() },
    { id: uid(), name: 'Lechuga', costPerUnit: 50, quantity: 10, unit: 'unidad', purchaseDate: '2026-05-18', expiryDate: '2026-05-22', stock: 10, vendible: false, totalPrice: 500, createdAt: new Date().toISOString() },
    { id: uid(), name: 'Tomate', costPerUnit: 80, quantity: 10, unit: 'unidad', purchaseDate: '2026-05-18', expiryDate: '2026-05-24', stock: 10, vendible: false, totalPrice: 800, createdAt: new Date().toISOString() },
    { id: uid(), name: 'Salsa especial', costPerUnit: 600, quantity: 2, unit: 'l', purchaseDate: '2026-05-01', expiryDate: '2026-07-01', stock: 2, vendible: false, totalPrice: 1200, createdAt: new Date().toISOString() },
    { id: uid(), name: 'Papas', costPerUnit: 120, quantity: 15, unit: 'kg', purchaseDate: '2026-05-16', expiryDate: '2026-06-16', stock: 15, vendible: false, totalPrice: 1800, createdAt: new Date().toISOString() },
  ]
  save('ingredients', ingredients)

  const supplies = [
    { id: uid(), name: 'Caja hamburguesa', costPerUnit: 30, quantity: 100, unit: 'unidad', purchaseDate: '2026-05-01', expiryDate: '', stock: 100, vendible: false, totalPrice: 3000, createdAt: new Date().toISOString() },
    { id: uid(), name: 'Envoltorio', costPerUnit: 7.5, quantity: 200, unit: 'unidad', purchaseDate: '2026-05-01', expiryDate: '', stock: 200, vendible: false, totalPrice: 1500, createdAt: new Date().toISOString() },
    { id: uid(), name: 'Servilletas', costPerUnit: 4, quantity: 500, unit: 'unidad', purchaseDate: '2026-05-01', expiryDate: '', stock: 500, vendible: false, totalPrice: 2000, createdAt: new Date().toISOString() },
    { id: uid(), name: 'Bandeja', costPerUnit: 50, quantity: 50, unit: 'unidad', purchaseDate: '2026-05-10', expiryDate: '', stock: 50, vendible: false, totalPrice: 2500, createdAt: new Date().toISOString() },
  ]
  save('supplies', supplies)

  const carne = ingredients[0], pan = ingredients[1], cheddar = ingredients[2], panceta = ingredients[3]
  const lechuga = ingredients[4], tomate = ingredients[5], salsa = ingredients[6], papas = ingredients[7]
  const caja = supplies[0], envoltorio = supplies[1]

  function mkCost(ings, sups) {
    let c = 0
    for (const i of ings) { const ref = ingredients.find(x => x.id === i.id); if (ref) c += ref.costPerUnit * i.qty }
    for (const s of sups) { const ref = supplies.find(x => x.id === s.id); if (ref) c += ref.costPerUnit * s.qty }
    return +c.toFixed(2)
  }

  const products = [
    { id: uid(), name: 'Hamburguesa Simple', description: 'Carne, pan, lechuga, tomate', image: '', profitPct: 100, ingredients: [{ id: carne.id, qty: 0.15 }, { id: pan.id, qty: 1 }, { id: lechuga.id, qty: 0.5 }, { id: tomate.id, qty: 0.5 }], supplies: [{ id: caja.id, qty: 1 }, { id: envoltorio.id, qty: 1 }], active: true, createdAt: new Date().toISOString() },
    { id: uid(), name: 'Hamburguesa Doble', description: 'Doble carne, pan, cheddar, panceta', image: '', profitPct: 100, ingredients: [{ id: carne.id, qty: 0.3 }, { id: pan.id, qty: 1 }, { id: cheddar.id, qty: 0.1 }, { id: panceta.id, qty: 0.1 }], supplies: [{ id: caja.id, qty: 1 }, { id: envoltorio.id, qty: 1 }], active: true, createdAt: new Date().toISOString() },
    { id: uid(), name: 'Hamburguesa Triple', description: 'Triple carne, pan, cheddar, panceta', image: '', profitPct: 100, ingredients: [{ id: carne.id, qty: 0.45 }, { id: pan.id, qty: 1 }, { id: cheddar.id, qty: 0.15 }, { id: panceta.id, qty: 0.15 }], supplies: [{ id: caja.id, qty: 1 }, { id: envoltorio.id, qty: 1 }], active: true, createdAt: new Date().toISOString() },
    { id: uid(), name: 'Papas Fritas', description: 'Porción de papas crujientes', image: '', profitPct: 150, ingredients: [{ id: papas.id, qty: 0.3 }], supplies: [{ id: supplies[3].id, qty: 1 }, { id: supplies[2].id, qty: 2 }], active: true, createdAt: new Date().toISOString() },
  ]
  products.forEach(p => { p.cost = mkCost(p.ingredients, p.supplies); p.salePrice = calcSalePrice(p.cost, p.profitPct) })
  save('products', products)

  const extras = [
    { id: uid(), name: 'Medallón extra', type: 'product', refId: products[0].id, price: 800, active: true, createdAt: new Date().toISOString() },
    { id: uid(), name: 'Cheddar extra', type: 'ingredient', refId: cheddar.id, price: 300, active: true, createdAt: new Date().toISOString() },
    { id: uid(), name: 'Panceta extra', type: 'ingredient', refId: panceta.id, price: 400, active: true, createdAt: new Date().toISOString() },
    { id: uid(), name: 'Papas extra', type: 'product', refId: products[3].id, price: 600, active: true, createdAt: new Date().toISOString() },
  ]
  save('extras', extras)

  const combos = [
    { id: uid(), name: 'Doble + Papas + Bebida', products: [{ productId: products[1].id, qty: 1 }, { productId: products[3].id, qty: 1 }], salePrice: 8500, startDate: '2026-05-01', endDate: '2026-06-30', active: true, createdAt: new Date().toISOString() },
    { id: uid(), name: 'Triple x2', products: [{ productId: products[2].id, qty: 2 }], salePrice: 12000, startDate: '2026-05-15', endDate: '2026-06-15', active: true, createdAt: new Date().toISOString() },
    { id: uid(), name: 'Simple + Papas', products: [{ productId: products[0].id, qty: 1 }, { productId: products[3].id, qty: 1 }], salePrice: 5000, startDate: '2026-05-20', endDate: '2026-05-25', active: true, createdAt: new Date().toISOString() },
  ]
  combos.forEach(c => {
    let cost = 0
    for (const entry of c.products) { const p = products.find(x => x.id === entry.productId); if (p) cost += p.cost * entry.qty }
    c.cost = +cost.toFixed(2)
    c.profitPct = c.cost > 0 ? +(((c.salePrice - c.cost) / c.cost) * 100).toFixed(1) : 0
    c.profitMoney = +(c.salePrice - c.cost).toFixed(2)
  })
  save('combos', combos)

  const discounts = [
    { id: uid(), name: 'Primera compra 5%', type: '%', value: 5, active: true, createdAt: new Date().toISOString() },
    { id: uid(), name: 'Cliente frecuente 10%', type: '%', value: 10, active: true, createdAt: new Date().toISOString() },
    { id: uid(), name: 'Descuento fijo $1000', type: 'fixed', value: 1000, active: true, createdAt: new Date().toISOString() },
  ]
  save('discounts', discounts)

  const sales = [
    {
      id: uid(), date: today(), lines: [
        { productId: products[1].id, type: 'product', name: products[1].name, unitPrice: products[1].salePrice, qty: 2, extras: [{ id: extras[1].id, name: extras[1].name, price: extras[1].price, type: extras[1].type, refId: extras[1].refId, qty: 2 }], subtotal: products[1].salePrice * 2, extraSubtotal: extras[1].price * 2, lineTotal: products[1].salePrice * 2 + extras[1].price * 2 },
        { productId: products[3].id, type: 'product', name: products[3].name, unitPrice: products[3].salePrice, qty: 1, extras: [], subtotal: products[3].salePrice, extraSubtotal: 0, lineTotal: products[3].salePrice },
      ], discounts: [], discountAmount: 0, subtotal: 0, total: 0, notes: '', createdAt: new Date().toISOString(),
    },
  ]
  const t1 = sales[0].lines.reduce((s, l) => s + l.lineTotal, 0)
  sales[0].subtotal = +t1.toFixed(2)
  sales[0].total = +t1.toFixed(2)
  save('sales', sales)

  save(SEED_KEY, true)
}
