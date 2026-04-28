'use client'
import { useEffect, useState, useCallback } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { TrendingUp, Users, Award, BarChart3, Crown, DollarSign } from 'lucide-react'

interface Stats {
  today: { count: number; revenue: number }
  week: { count: number; revenue: number }
  month: { count: number; revenue: number }
  topCustomersByCount: { customer_name: string; order_count: number; total_spent: number }[]
  topCustomersByRevenue: { customer_name: string; order_count: number; total_spent: number }[]
  returningCustomers: { customer_name: string; order_count: number }[]
  trend: { label: string; orders: number; revenue: number }[]
  peakDays: { day: string; orders: number }[]
  avgOrderValue: number
  pendingCount: number
  deliveredCount: number
}

function fmt(n: number) {
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(n)
}

const MEDAL = ['🥇', '🥈', '🥉']
const PIE_COLORS = ['#10b981', '#f59e0b']

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'white', border: '1px solid #e8edf5', borderRadius: 12, padding: '10px 16px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: 13 }}>
      <p style={{ fontWeight: 700, color: '#0f1f3d', marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.name === 'revenue' ? '#2d6aff' : '#10b981', fontWeight: 600 }}>
          {p.name === 'revenue' ? `הכנסות: ${fmt(p.value)}` : `הזמנות: ${p.value}`}
        </p>
      ))}
    </div>
  )
}

export default function StatisticsPage() {
  const [stats, setStats]   = useState<Stats | null>(null)
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetch(`/api/statistics?period=${period}`).then(r => r.json())
    setStats(data); setLoading(false)
  }, [period])
  useEffect(() => { load() }, [load])

  if (loading || !stats) return (
    <div style={{ padding: 80, textAlign: 'center', color: '#9baabe' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #e0e9ff', borderTopColor: '#2d6aff', borderRadius: '50%', margin: '0 auto 14px', animation: 'spin 0.8s linear infinite' }} />
      טוען סטטיסטיקות...
    </div>
  )

  const statusPie = [
    { name: 'סופק', value: stats.deliveredCount },
    { name: 'ממתין', value: stats.pendingCount },
  ]

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <div style={{ width: 4, height: 28, background: 'linear-gradient(180deg, #7c3aed, #a78bfa)', borderRadius: 99 }} />
          <h1 className="page-title">סטטיסטיקות מתקדמות</h1>
        </div>
        <p className="page-subtitle" style={{ marginRight: 16 }}>ניתוח מעמיק של פעילות העסק</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'הזמנות החודש', value: stats.month.count, sub: fmt(stats.month.revenue), color: '#2d6aff' },
          { label: 'הזמנות השבוע', value: stats.week.count, sub: fmt(stats.week.revenue), color: '#10b981' },
          { label: 'ממוצע הזמנה', value: fmt(stats.avgOrderValue), sub: 'לכל הזמנה עם סכום', color: '#d97706' },
          { label: 'לקוחות חוזרים', value: stats.returningCustomers.length, sub: 'הזמינו 2+ פעמים', color: '#7c3aed' },
        ].map((k, i) => (
          <div key={i} className="card" style={{ padding: '20px 22px', borderTop: `3px solid ${k.color}` }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#0f1f3d', marginBottom: 4 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: '#6b7a99', marginBottom: 4, fontWeight: 500 }}>{k.label}</div>
            <div style={{ fontSize: 12, color: k.color, fontWeight: 600 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Trend Chart */}
      <div className="card" style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #2d6aff, #5c8cff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={20} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#0f1f3d' }}>מגמות הזמנות</div>
              <div style={{ fontSize: 12, color: '#9baabe' }}>הזמנות והכנסות לאורך זמן</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['daily', 'weekly', 'monthly'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '7px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
                background: period === p ? 'linear-gradient(135deg, #2d6aff, #5c8cff)' : '#f4f6fb',
                color: period === p ? 'white' : '#6b7a99',
                boxShadow: period === p ? '0 2px 8px rgba(45,106,255,0.3)' : 'none',
                transition: 'all 0.15s',
              }}>
                {p === 'daily' ? 'יומי' : p === 'weekly' ? 'שבועי' : 'חודשי'}
              </button>
            ))}
          </div>
        </div>
        {stats.trend.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9baabe' }}>אין נתונים לתקופה זו</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={stats.trend} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f4fb" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9baabe' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#9baabe' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#9baabe' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2.5} dot={false} name="orders" />
              <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#2d6aff" strokeWidth={2.5} dot={false} name="revenue" strokeDasharray="6 3" />
            </LineChart>
          </ResponsiveContainer>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 24, height: 3, background: '#10b981', borderRadius: 2 }} />
            <span style={{ fontSize: 12, color: '#9baabe' }}>מספר הזמנות</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 24, height: 3, background: '#2d6aff', borderRadius: 2, borderTop: '2px dashed #2d6aff', opacity: 0.7 }} />
            <span style={{ fontSize: 12, color: '#9baabe' }}>הכנסות</span>
          </div>
        </div>
      </div>

      {/* Customers + Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Top by count */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg, #d97706, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={18} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#0f1f3d' }}>מובילים לפי כמות</div>
              <div style={{ fontSize: 11, color: '#9baabe' }}>30 הימים האחרונים</div>
            </div>
          </div>
          {stats.topCustomersByCount.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 30, color: '#9baabe', fontSize: 14 }}>אין נתונים</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stats.topCustomersByCount.slice(0, 5).map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 18, flexShrink: 0, width: 24 }}>{MEDAL[i] ?? `${i + 1}.`}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0f1f3d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.customer_name}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#2d6aff', flexShrink: 0, marginRight: 8 }}>{c.order_count} הזמ'</span>
                    </div>
                    <div style={{ height: 5, background: '#f1f4fb', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'linear-gradient(90deg, #2d6aff, #5c8cff)', borderRadius: 99, width: `${(c.order_count / (stats.topCustomersByCount[0]?.order_count || 1)) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top by revenue */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg, #059669, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={18} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#0f1f3d' }}>מובילים לפי הכנסה</div>
              <div style={{ fontSize: 11, color: '#9baabe' }}>30 הימים האחרונים</div>
            </div>
          </div>
          {stats.topCustomersByRevenue.filter(c => c.total_spent > 0).length === 0 ? (
            <div style={{ textAlign: 'center', padding: 30, color: '#9baabe', fontSize: 14 }}>אין נתוני סכומים</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stats.topCustomersByRevenue.filter(c => c.total_spent > 0).slice(0, 5).map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 18, flexShrink: 0, width: 24 }}>{MEDAL[i] ?? `${i + 1}.`}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0f1f3d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.customer_name}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#10b981', flexShrink: 0, marginRight: 8 }}>{fmt(c.total_spent)}</span>
                    </div>
                    <div style={{ height: 5, background: '#f1f4fb', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'linear-gradient(90deg, #059669, #10b981)', borderRadius: 99, width: `${(c.total_spent / (stats.topCustomersByRevenue[0]?.total_spent || 1)) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Peak days bar chart */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart3 size={18} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#0f1f3d' }}>עומס לפי יום בשבוע</div>
              <div style={{ fontSize: 11, color: '#9baabe' }}>ימי עסקים עמוסים</div>
            </div>
          </div>
          {stats.peakDays.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 30, color: '#9baabe' }}>אין נתונים</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.peakDays} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f4fb" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9baabe' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9baabe' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e8edf5', fontSize: 13 }} />
                <Bar dataKey="orders" fill="url(#barGrad)" radius={[6, 6, 0, 0]} name="הזמנות" />
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#a78bfa" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie status */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg, #10b981, #34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#0f1f3d' }}>יחס אספקות</div>
              <div style={{ fontSize: 11, color: '#9baabe' }}>סה"כ כל הזמנות</div>
            </div>
          </div>
          {stats.pendingCount + stats.deliveredCount === 0 ? (
            <div style={{ textAlign: 'center', padding: 30, color: '#9baabe' }}>אין נתונים</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <ResponsiveContainer width="55%" height={180}>
                <PieChart>
                  <Pie data={statusPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={5} startAngle={90} endAngle={-270}>
                    {statusPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {[
                  { label: 'סופק', value: stats.deliveredCount, color: '#10b981', pct: Math.round(stats.deliveredCount / (stats.deliveredCount + stats.pendingCount) * 100) },
                  { label: 'ממתין', value: stats.pendingCount, color: '#f59e0b', pct: Math.round(stats.pendingCount / (stats.deliveredCount + stats.pendingCount) * 100) },
                ].map(s => (
                  <div key={s.label} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#3d4f6e' }}>{s.label}</span>
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: '#9baabe' }}>{s.pct}% מסה"כ</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
