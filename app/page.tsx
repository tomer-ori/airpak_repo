'use client'
import { useEffect, useState, useCallback } from 'react'
import StatsCard from '@/components/StatsCard'
import { ShoppingCart, AlertCircle, CheckCircle, Mail, Plus } from 'lucide-react'
import Link from 'next/link'

interface Stats {
  today: { count: number }
  week: { count: number }
  month: { count: number }
  pendingCount: number
  deliveredCount: number
}
interface Order {
  id: number; customer_name: string; order_date: string; status: 'pending' | 'delivered'; source: string
}
interface Alert { id: number; message: string; customer_name: string; order_date: string }

export default function Dashboard() {
  const [stats, setStats]       = useState<Stats | null>(null)
  const [todayOrders, setToday] = useState<Order[]>([])
  const [alerts, setAlerts]     = useState<Alert[]>([])
  const [syncing, setSyncing]   = useState(false)
  const [syncMsg, setSyncMsg]   = useState('')
  const [loading, setLoading]   = useState(true)

  const loadAll = useCallback(async () => {
    setLoading(true)
    const today = new Date().toISOString().slice(0, 10)
    const [s, o, a] = await Promise.all([
      fetch('/api/statistics').then(r => r.json()),
      fetch(`/api/orders?from=${today}&to=${today}`).then(r => r.json()),
      fetch('/api/alerts').then(r => r.json()),
    ])
    setStats(s); setToday(Array.isArray(o) ? o : []); setAlerts(Array.isArray(a) ? a.slice(0, 4) : [])
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const syncEmail = async () => {
    setSyncing(true); setSyncMsg('')
    const res = await fetch('/api/email/sync', { method: 'POST' }).then(r => r.json())
    setSyncMsg(res.error ? `שגיאה: ${res.error}` : `סונקרנו ${res.added} הזמנות חדשות`)
    setSyncing(false); loadAll()
  }

  const markDelivered = async (id: number) => {
    await fetch(`/api/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'delivered' }) })
    loadAll()
  }

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f4f6fb' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, border: '3px solid #e0e9ff', borderTopColor: '#2d6aff', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#6b7a99', fontSize: 15 }}>טוען נתונים...</p>
      </div>
    </div>
  )

  const todayStr = new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="page-container">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <div style={{ width: 4, height: 28, background: 'linear-gradient(180deg, #2d6aff, #5c8cff)', borderRadius: 99 }} />
            <h1 className="page-title">לוח בקרה</h1>
          </div>
          <p className="page-subtitle" style={{ marginRight: 16 }}>{todayStr}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
<button onClick={syncEmail} disabled={syncing} className="btn-secondary">
            <Mail size={15} /> {syncing ? 'מסנכרן...' : 'סנכרון מייל'}
          </button>
          <Link href="/orders?new=1" className="btn-primary">
            <Plus size={16} /> הזמנה חדשה
          </Link>
        </div>
      </div>

      {syncMsg && (
        <div style={{ marginBottom: 20, padding: '12px 18px', background: '#f0f4ff', border: '1px solid #bfccff', borderRadius: 12, color: '#1a52db', fontSize: 14, fontWeight: 500 }}>
          {syncMsg}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, marginBottom: 32 }}>
        <StatsCard
          title="הזמנות היום"
          value={stats?.today.count ?? 0}
          sub="הזמנות שנכנסו היום"
          icon={<ShoppingCart size={22} />}
          gradient="linear-gradient(135deg, #2d6aff 0%, #5c8cff 100%)"
        />
        <StatsCard
          title="הזמנות השבוע"
          value={stats?.week.count ?? 0}
          sub="7 הימים האחרונים"
          icon={<ShoppingCart size={22} />}
          gradient="linear-gradient(135deg, #059669 0%, #10b981 100%)"
        />
        <StatsCard
          title="ממתינות לאספקה"
          value={stats?.pendingCount ?? 0}
          sub="הזמנות פתוחות"
          icon={<AlertCircle size={22} />}
          gradient="linear-gradient(135deg, #d97706 0%, #f59e0b 100%)"
        />
        <StatsCard
          title="סופקו החודש"
          value={stats?.deliveredCount ?? 0}
          sub="הזמנות שסגרנו"
          icon={<CheckCircle size={22} />}
          gradient="linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)"
        />
      </div>

      {/* Bottom panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Today's Orders */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #2d6aff 0%, #5c8cff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingCart size={18} color="white" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#0f1f3d' }}>הזמנות היום</div>
                <div style={{ fontSize: 12, color: '#9baabe' }}>{todayOrders.length} הזמנות</div>
              </div>
            </div>
            <Link href="/orders" style={{ fontSize: 13, fontWeight: 600, color: '#2d6aff', textDecoration: 'none' }}>
              הכל ←
            </Link>
          </div>

          {todayOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: '#9baabe' }}>
              <ShoppingCart size={40} style={{ margin: '0 auto 10px', opacity: 0.25 }} />
              <p style={{ fontSize: 14 }}>לא התקבלו הזמנות היום</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {todayOrders.map(o => (
                <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: '#f8fafc', borderRadius: 12, border: '1px solid #edf0f7' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #e0e9ff, #f0f4ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 16 }}>📦</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0f1f3d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.customer_name}</div>
                  </div>
                  {o.status === 'pending' ? (
                    <button onClick={() => markDelivered(o.id)} className="btn-success" style={{ flexShrink: 0, fontSize: 12 }}>
                      ✓ סופק
                    </button>
                  ) : (
                    <span className="badge-delivered">✓ סופק</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Alerts */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircle size={18} color="white" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#0f1f3d' }}>התראות פעילות</div>
                <div style={{ fontSize: 12, color: '#9baabe' }}>{alerts.length} התראות</div>
              </div>
            </div>
            <Link href="/alerts" style={{ fontSize: 13, fontWeight: 600, color: '#2d6aff', textDecoration: 'none' }}>
              הכל ←
            </Link>
          </div>

          {alerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: '#9baabe' }}>
              <CheckCircle size={40} color="#10b981" style={{ margin: '0 auto 10px', opacity: 0.5 }} />
              <p style={{ fontSize: 14, color: '#10b981', fontWeight: 600 }}>הכל מסודר, אין התראות!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {alerts.map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', background: '#fff5f7', borderRadius: 12, border: '1px solid #fecdd3' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f43f5e', marginTop: 5, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#be123c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.customer_name}
                    </div>
                    <div style={{ fontSize: 12, color: '#e11d48', marginTop: 2 }}>{a.message}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
