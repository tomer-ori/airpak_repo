import { getDb, getSetting } from './db'

export function checkAndCreateAlerts(): number {
  const db = getDb()
  const alertDays = parseInt(getSetting('alert_days') || '4', 10)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - alertDays)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  const staleOrders = db.prepare(`
    SELECT id, customer_name, order_date FROM orders
    WHERE status = 'pending'
      AND order_date <= ?
      AND id NOT IN (SELECT order_id FROM alerts WHERE alert_type = 'undelivered' AND is_resolved = 0)
  `).all(cutoffStr) as { id: number; customer_name: string; order_date: string }[]

  const insert = db.prepare(`
    INSERT INTO alerts (order_id, alert_type, message)
    VALUES (?, 'undelivered', ?)
  `)

  let created = 0
  for (const order of staleOrders) {
    const daysLate = Math.floor((Date.now() - new Date(order.order_date).getTime()) / 86400000)
    insert.run(order.id, `הזמנה של ${order.customer_name} לא סופקה כבר ${daysLate} ימים`)
    created++
  }

  return created
}

export function resolveOrderAlerts(orderId: number) {
  getDb().prepare(`UPDATE alerts SET is_resolved = 1 WHERE order_id = ? AND is_resolved = 0`).run(orderId)
}
