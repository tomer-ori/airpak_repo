import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST() {
  const db = getDb()
  const existing = db.prepare('SELECT COUNT(*) as c FROM orders').get() as { c: number }
  if (existing.c > 0) return NextResponse.json({ message: 'כבר קיימים נתונים במערכת' })

  const customers = [
    { name: 'חברת אלפא בע"מ', email: 'orders@alpha.co.il' },
    { name: 'בטא מסחר', email: 'procurement@beta.com' },
    { name: 'גמא תעשיות', email: 'gama@gama.co.il' },
    { name: 'דלתא לוגיסטיקה', email: 'supply@delta.co.il' },
    { name: 'אפסילון מיכון', email: 'orders@epsilon.com' },
    { name: 'זטא ייצוא', email: 'zeta@zeta.co.il' },
    { name: 'אטא שיווק', email: 'eta@shop.co.il' },
  ]

  const insert = db.prepare(`
    INSERT INTO orders (customer_name, customer_email, order_date, amount, status, source, notes)
    VALUES (?, ?, ?, ?, ?, 'manual', ?)
  `)

  const now = new Date()
  const seedOrders = []

  for (let i = 0; i < 60; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - Math.floor(Math.random() * 90))
    const customer = customers[Math.floor(Math.random() * customers.length)]
    const amount = Math.round((Math.random() * 8000 + 500) / 100) * 100
    const daysAgo = Math.floor((now.getTime() - d.getTime()) / 86400000)
    const status = daysAgo > 5 ? 'delivered' : (Math.random() > 0.3 ? 'delivered' : 'pending')
    seedOrders.push({ ...customer, date: d.toISOString().slice(0, 10), amount, status })
  }

  for (const o of seedOrders) {
    insert.run(o.name, o.email, o.date, o.amount, o.status, '')
  }

  return NextResponse.json({ message: `נוספו ${seedOrders.length} הזמנות לדוגמה` })
}
