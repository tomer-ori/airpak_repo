import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { resolveOrderAlerts } from '@/lib/alertChecker'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb()
  const id = parseInt(params.id)
  const body = await req.json()

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as { status: string } | undefined
  if (!order) return NextResponse.json({ error: 'הזמנה לא נמצאה' }, { status: 404 })

  const { status, notes, amount, customer_name, customer_email } = body
  const updates: string[] = []
  const vals: (string | number)[] = []

  if (status !== undefined) {
    updates.push('status = ?')
    vals.push(status)
    if (status === 'delivered') {
      updates.push("delivered_at = datetime('now')")
      resolveOrderAlerts(id)
    } else {
      updates.push('delivered_at = NULL')
    }
  }
  if (notes !== undefined) { updates.push('notes = ?'); vals.push(notes) }
  if (amount !== undefined) { updates.push('amount = ?'); vals.push(amount) }
  if (customer_name !== undefined) { updates.push('customer_name = ?'); vals.push(customer_name) }
  if (customer_email !== undefined) { updates.push('customer_email = ?'); vals.push(customer_email) }

  if (updates.length === 0) return NextResponse.json({ error: 'אין שדות לעדכון' }, { status: 400 })

  vals.push(id)
  db.prepare(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`).run(...vals)

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id)
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb()
  const id = parseInt(params.id)
  const order = db.prepare('SELECT id, gmail_message_id FROM orders WHERE id = ?').get(id) as { id: number; gmail_message_id: string | null } | undefined
  if (!order) return NextResponse.json({ error: 'הזמנה לא נמצאה' }, { status: 404 })

  if (order.gmail_message_id) {
    db.prepare(`INSERT OR IGNORE INTO blocked_emails (gmail_message_id) VALUES (?)`).run(order.gmail_message_id)
  }

  db.prepare('DELETE FROM orders WHERE id = ?').run(id)
  return NextResponse.json({ success: true })
}
