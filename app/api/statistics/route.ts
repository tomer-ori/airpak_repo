import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const db = getDb()
  const { searchParams } = req.nextUrl
  const period = searchParams.get('period') ?? 'monthly'

  const today = new Date().toISOString().slice(0, 10)
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
  const yearAgo = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10)

  const todayOrders = db.prepare(`SELECT COUNT(*) as count, COALESCE(SUM(amount),0) as revenue FROM orders WHERE order_date = ?`).get(today) as { count: number; revenue: number }
  const weekOrders = db.prepare(`SELECT COUNT(*) as count, COALESCE(SUM(amount),0) as revenue FROM orders WHERE order_date >= ?`).get(weekAgo) as { count: number; revenue: number }
  const monthOrders = db.prepare(`SELECT COUNT(*) as count, COALESCE(SUM(amount),0) as revenue FROM orders WHERE order_date >= ?`).get(monthAgo) as { count: number; revenue: number }

  const topCustomersByCount = db.prepare(`
    SELECT customer_name, customer_email, COUNT(*) as order_count, COALESCE(SUM(amount),0) as total_spent
    FROM orders WHERE order_date >= ?
    GROUP BY customer_name, customer_email
    ORDER BY order_count DESC LIMIT 10
  `).all(monthAgo)

  const topCustomersByRevenue = db.prepare(`
    SELECT customer_name, customer_email, COUNT(*) as order_count, COALESCE(SUM(amount),0) as total_spent
    FROM orders WHERE order_date >= ?
    GROUP BY customer_name, customer_email
    ORDER BY total_spent DESC LIMIT 10
  `).all(monthAgo)

  const returningCustomers = db.prepare(`
    SELECT customer_name, customer_email, COUNT(*) as order_count
    FROM orders
    GROUP BY customer_name, customer_email
    HAVING order_count > 1
    ORDER BY order_count DESC LIMIT 10
  `).all()

  let trendQuery: string
  let trendParam: string
  if (period === 'daily') {
    trendQuery = `SELECT order_date as label, COUNT(*) as orders, COALESCE(SUM(amount),0) as revenue FROM orders WHERE order_date >= ? GROUP BY order_date ORDER BY order_date`
    trendParam = weekAgo
  } else if (period === 'weekly') {
    trendQuery = `SELECT strftime('%Y-W%W', order_date) as label, COUNT(*) as orders, COALESCE(SUM(amount),0) as revenue FROM orders WHERE order_date >= ? GROUP BY label ORDER BY label`
    trendParam = monthAgo
  } else {
    trendQuery = `SELECT strftime('%Y-%m', order_date) as label, COUNT(*) as orders, COALESCE(SUM(amount),0) as revenue FROM orders WHERE order_date >= ? GROUP BY label ORDER BY label`
    trendParam = yearAgo
  }
  const trend = db.prepare(trendQuery).all(trendParam)

  const dayOfWeekStats = db.prepare(`
    SELECT strftime('%w', order_date) as dow, COUNT(*) as orders
    FROM orders GROUP BY dow ORDER BY dow
  `).all() as { dow: string; orders: number }[]

  const dowNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
  const peakDays = dayOfWeekStats.map(r => ({ day: dowNames[parseInt(r.dow)], orders: r.orders }))

  const avgOrderValue = db.prepare(`SELECT AVG(amount) as avg FROM orders WHERE amount > 0`).get() as { avg: number | null }
  const pendingCount = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE status = 'pending'`).get() as { count: number }
  const deliveredCount = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE status = 'delivered'`).get() as { count: number }

  return NextResponse.json({
    today: todayOrders,
    week: weekOrders,
    month: monthOrders,
    topCustomersByCount,
    topCustomersByRevenue,
    returningCustomers,
    trend,
    peakDays,
    avgOrderValue: avgOrderValue.avg ?? 0,
    pendingCount: pendingCount.count,
    deliveredCount: deliveredCount.count,
  })
}
