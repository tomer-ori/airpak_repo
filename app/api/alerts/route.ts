import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { checkAndCreateAlerts } from '@/lib/alertChecker'

export const dynamic = 'force-dynamic'

export async function GET() {
  checkAndCreateAlerts()
  const db = getDb()

  const alerts = db.prepare(`
    SELECT a.*, o.customer_name, o.order_date, o.amount, o.status as order_status
    FROM alerts a
    JOIN orders o ON a.order_id = o.id
    WHERE a.is_resolved = 0
    ORDER BY a.created_at DESC
  `).all()

  return NextResponse.json(alerts)
}
