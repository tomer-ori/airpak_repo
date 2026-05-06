import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const db = getDb()
  const { searchParams } = req.nextUrl
  const period = searchParams.get('period') ?? 'monthly'

  const today    = new Date().toISOString().slice(0, 10)
  const weekAgo  = new Date(Date.now() - 7   * 86400000).toISOString().slice(0, 10)
  const monthAgo = new Date(Date.now() - 30  * 86400000).toISOString().slice(0, 10)
  const yearAgo  = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10)

  const todayOrders = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE order_date = ?`).get(today)          as { count: number }
  const weekOrders  = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE order_date >= ?`).get(weekAgo)       as { count: number }
  const monthOrders = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE order_date >= ?`).get(monthAgo)      as { count: number }

  const topCustomersByCount = db.prepare(`
    SELECT customer_name, COUNT(*) as order_count
    FROM orders WHERE order_date >= ?
    GROUP BY customer_name
    ORDER BY order_count DESC LIMIT 10
  `).all(monthAgo)

  const returningCustomers = db.prepare(`
    SELECT customer_name, COUNT(*) as order_count
    FROM orders
    GROUP BY customer_name
    HAVING order_count > 1
    ORDER BY order_count DESC LIMIT 10
  `).all()

  let trend: { label: string; orders: number }[]

  if (period === 'daily') {
    // שעות 00-23 לפי שעת קבלת המייל בשעון ישראל
    const rows = db.prepare(
      `SELECT strftime('%H', datetime(COALESCE(received_at, created_at), '+3 hours')) as h, COUNT(*) as orders
       FROM orders WHERE date(datetime(COALESCE(received_at, created_at), '+3 hours')) = ? GROUP BY h`
    ).all(today) as { h: string; orders: number }[]
    const byHour: Record<string, number> = {}
    for (const r of rows) byHour[r.h] = r.orders
    trend = Array.from({ length: 24 }, (_, i) => {
      const h = String(i).padStart(2, '0')
      return { label: `${h}:00`, orders: byHour[h] ?? 0 }
    })

  } else if (period === 'weekly') {
    // 7 ימים אחרונים — ממלאים 0 לימים ללא הזמנות
    const rows = db.prepare(
      `SELECT order_date as d, COUNT(*) as orders FROM orders WHERE order_date >= ? GROUP BY d`
    ).all(weekAgo) as { d: string; orders: number }[]
    const byDay: Record<string, number> = {}
    for (const r of rows) byDay[r.d] = r.orders
    trend = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10)
      return { label: d, orders: byDay[d] ?? 0 }
    })

  } else {
    // כל ימי החודש הנוכחי — מהראשון עד האחרון, עתידיים = 0
    const year  = parseInt(today.slice(0, 4))
    const month = parseInt(today.slice(5, 7))
    const daysInMonth = new Date(year, month, 0).getDate()
    const startOfMonth = today.slice(0, 7) + '-01'
    const rows = db.prepare(
      `SELECT order_date as d, COUNT(*) as orders FROM orders WHERE order_date >= ? AND order_date <= ? GROUP BY d`
    ).all(startOfMonth, today) as { d: string; orders: number }[]
    const byDay: Record<string, number> = {}
    for (const r of rows) byDay[r.d] = r.orders
    trend = Array.from({ length: daysInMonth }, (_, i) => {
      const day = String(i + 1).padStart(2, '0')
      const d = `${today.slice(0, 7)}-${day}`
      return { label: d, orders: byDay[d] ?? 0 }
    })
  }


  const dayOfWeekStats = db.prepare(`
    SELECT strftime('%w', order_date) as dow, COUNT(*) as orders
    FROM orders GROUP BY dow ORDER BY dow
  `).all() as { dow: string; orders: number }[]

  const dowNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
  const peakDays = dayOfWeekStats.map(r => ({ day: dowNames[parseInt(r.dow)], orders: r.orders }))

  const pendingCount   = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE status = 'pending'`).get()   as { count: number }
  const deliveredCount = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE status = 'delivered'`).get() as { count: number }

  return NextResponse.json({
    today:  todayOrders,
    week:   weekOrders,
    month:  monthOrders,
    topCustomersByCount,
    returningCustomers,
    trend,
    peakDays,
    pendingCount:   pendingCount.count,
    deliveredCount: deliveredCount.count,
  })
}
