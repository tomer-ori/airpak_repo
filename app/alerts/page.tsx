'use client'
import { useEffect, useState, useCallback } from 'react'
import { AlertCircle, CheckCircle, Clock, Package, Bell, Zap } from 'lucide-react'

interface Alert {
  id: number; order_id: number; message: string; alert_type: string
  created_at: string; customer_name: string; order_date: string; amount: number; order_status: string
}
function fmt(n: number) {
  if (!n || n === 0) return ''
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(n)
}
function daysSince(d: string) { return Math.floor((Date.now() - new Date(d).getTime()) / 86400000) }

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetch('/api/alerts').then(r => r.json())
    setAlerts(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const resolve = async (id: number) => { await fetch(`/api/alerts/${id}`, { method: 'PATCH' }); load() }
  const markDelivered = async (orderId: number) => {
    await fetch(`/api/orders/${orderId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'delivered' }) })
    load()
  }

  const urgentAlerts  = alerts.filter(a => daysSince(a.order_date) >= 7)
  const normalAlerts  = alerts.filter(a => daysSince(a.order_date) < 7)

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <div style={{ width: 4, height: 28, background: 'linear-gradient(180deg, #e11d48, #f43f5e)', borderRadius: 99 }} />
          <h1 className="page-title">התראות</h1>
          {alerts.length > 0 && (
            <span style={{ background: '#f43f5e', color: 'white', fontSize: 13, fontWeight: 800, padding: '2px 12px', borderRadius: 20, boxShadow: '0 2px 8px rgba(244,63,94,0.4)' }}>
              {alerts.length}
            </span>
          )}
        </div>
        <p className="page-subtitle" style={{ marginRight: 16 }}>הזמנות שעברו את מועד האספקה הצפוי</p>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#9baabe' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #fecdd3', borderTopColor: '#f43f5e', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
          טוען...
        </div>
      ) : alerts.length === 0 ? (
        <div className="card" style={{ padding: 80, textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={36} color="#10b981" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f1f3d', marginBottom: 8 }}>הכל מסודר!</h2>
          <p style={{ color: '#9baabe', fontSize: 15 }}>אין התראות פעילות כרגע. כל ההזמנות מטופלות.</p>
        </div>
      ) : (
        <>
          {/* Summary bar */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28
          }}>
            {[
              { label: 'סה"כ התראות', value: alerts.length, color: '#f43f5e', bg: '#fff5f7' },
              { label: 'דחופות (7+ ימים)', value: urgentAlerts.length, color: '#e11d48', bg: '#fff1f2' },
              { label: 'רגילות (4-6 ימים)', value: normalAlerts.length, color: '#d97706', bg: '#fffbeb' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '18px 22px', borderTop: `3px solid ${s.color}` }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 13, color: '#6b7a99', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Urgent */}
          {urgentAlerts.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Zap size={16} color="#e11d48" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#e11d48', textTransform: 'uppercase', letterSpacing: '0.05em' }}>דחופות ביותר</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                {urgentAlerts.map(a => <AlertCard key={a.id} a={a} onDeliver={markDelivered} onResolve={resolve} urgent />)}
              </div>
            </>
          )}

          {/* Normal */}
          {normalAlerts.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Bell size={16} color="#d97706" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>התראות רגילות</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {normalAlerts.map(a => <AlertCard key={a.id} a={a} onDeliver={markDelivered} onResolve={resolve} urgent={false} />)}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

function AlertCard({ a, onDeliver, onResolve, urgent }: { a: Alert; onDeliver: (id: number) => void; onResolve: (id: number) => void; urgent: boolean }) {
  const days = daysSince(a.order_date)
  const fmt2 = (n: number) => n > 0 ? new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(n) : ''

  return (
    <div className="card" style={{ padding: 20, borderRight: `4px solid ${urgent ? '#f43f5e' : '#f59e0b'}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Icon */}
        <div style={{
          width: 48, height: 48, borderRadius: 14, flexShrink: 0,
          background: urgent ? 'linear-gradient(135deg, #fff1f2, #ffe4e8)' : 'linear-gradient(135deg, #fffbeb, #fef3c7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${urgent ? '#fecdd3' : '#fde68a'}`,
        }}>
          <Package size={22} color={urgent ? '#e11d48' : '#d97706'} />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#0f1f3d' }}>{a.customer_name}</span>
            <span style={{
              background: urgent ? '#fff1f2' : '#fffbeb',
              color: urgent ? '#e11d48' : '#d97706',
              fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
              border: `1px solid ${urgent ? '#fecdd3' : '#fde68a'}`,
            }}>
              {days} ימים ללא אספקה
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#6b7a99', marginBottom: 2 }}>{a.message}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: '#9baabe' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={11} /> {new Date(a.order_date).toLocaleDateString('he-IL')}
            </span>
            {a.amount > 0 && <span style={{ fontWeight: 600, color: '#4a5f80' }}>{fmt2(a.amount)}</span>}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <button onClick={() => onDeliver(a.order_id)} className="btn-success">
            <CheckCircle size={15} /> סמן סופק
          </button>
          <button onClick={() => onResolve(a.id)} className="btn-secondary" style={{ fontSize: 13, padding: '8px 14px' }}>
            סגור
          </button>
        </div>
      </div>
    </div>
  )
}
