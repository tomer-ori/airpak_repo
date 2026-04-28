import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { checkAndCreateAlerts } from '@/lib/alertChecker'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const db = getDb()
  const { searchParams } = req.nextUrl
  const dateFrom = searchParams.get('from')
  const dateTo = searchParams.get('to')
  const status = searchParams.get('status')
  const search = searchParams.get('search')

  let query = 'SELECT * FROM orders WHERE 1=1'
  const params: (string | number)[] = []

  if (dateFrom) { query += ' AND order_date >= ?'; params.push(dateFrom) }
  if (dateTo) { query += ' AND order_date <= ?'; params.push(dateTo) }
  if (status && status !== 'all') { query += ' AND status = ?'; params.push(status) }
  if (search) {
    query += ' AND (customer_name LIKE ? OR customer_email LIKE ? OR email_subject LIKE ?)'
    params.push(`%${search}%`, `%${search}%`, `%${search}%`)
  }

  query += ' ORDER BY order_date DESC, created_at DESC'

  const orders = db.prepare(query).all(...params)
  return NextResponse.json(orders)
}

export async function POST(req: NextRequest) {
  const db = getDb()
  const body = await req.json()
  const { customer_name, customer_email = '', order_date, amount = 0, notes = '', source = 'manual' } = body

  if (!customer_name || !order_date) {
    return NextResponse.json({ error: 'שם לקוח ותאריך הם שדות חובה' }, { status: 400 })
  }

  const result = db.prepare(`
    INSERT INTO orders (customer_name, customer_email, order_date, amount, notes, source)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(customer_name, customer_email, order_date, amount, notes, source)

  checkAndCreateAlerts()

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid)
  return NextResponse.json(order, { status: 201 })
}
