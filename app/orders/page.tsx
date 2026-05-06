'use client'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, Search, Trash2, Check, Mail, User, X, Filter, FileText, ExternalLink } from 'lucide-react'

function renderEmailBody(text: string) {
  const URL_RE = /(https?:\/\/[^\s\)\]>'"]+)/g
  const parts = text.split(URL_RE)
  return parts.map((part, i) => {
    if (!URL_RE.test(part)) { URL_RE.lastIndex = 0; return part }
    URL_RE.lastIndex = 0
    const isPdf = part.toLowerCase().includes('.pdf')
    return (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer"
        style={{ color: isPdf ? '#059669' : '#2d6aff', fontWeight: isPdf ? 700 : 400,
          textDecoration: 'underline', wordBreak: 'break-all', display: 'inline-flex',
          alignItems: 'center', gap: 3 }}>
        {isPdf && <FileText size={13} />}{part}{!isPdf && <ExternalLink size={11} />}
      </a>
    )
  })
}

interface Order {
  id: number; customer_name: string; customer_email: string; order_date: string
  amount: number; status: 'pending' | 'delivered'; source: string; notes: string
  email_subject: string; email_snippet: string; received_at: string | null
  attachments: string
}

function today() { return new Date().toISOString().slice(0, 10) }
function weekAgo() { return new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10) }

interface Form { customer_name: string; customer_email: string; order_date: string; amount: string; notes: string }

function OrdersInner() {
  const sp = useSearchParams()
  const router = useRouter()

  const [orders, setOrders]     = useState<Order[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [from, setFrom]         = useState(weekAgo())
  const [to, setTo]             = useState(today())
  const [status, setStatus]     = useState('all')
  const [showForm, setShowForm] = useState(sp.get('new') === '1')
  const [form, setForm]         = useState<Form>({ customer_name: '', customer_email: '', order_date: today(), amount: '', notes: '' })
  const [saving, setSaving]     = useState(false)
  const [expandedId, setExpand] = useState<number | null>(null)

  const loadOrders = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ from, to, status })
    if (search) params.set('search', search)
    const data = await fetch(`/api/orders?${params}`).then(r => r.json())
    setOrders(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [from, to, status, search])

  useEffect(() => { loadOrders() }, [loadOrders])

  const markDelivered = async (id: number) => {
    await fetch(`/api/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'delivered' }) })
    loadOrders()
  }

  const markPending = async (id: number) => {
    await fetch(`/api/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'pending' }) })
    loadOrders()
  }

  const deleteOrder = async (id: number) => {
    if (!confirm('האם למחוק הזמנה זו לצמיתות?')) return
    await fetch(`/api/orders/${id}`, { method: 'DELETE' })
    loadOrders()
  }

  const submitNew = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.customer_name || !form.order_date) return
    setSaving(true)
    await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, amount: parseFloat(form.amount) || 0 }) })
    setSaving(false); setShowForm(false)
    setForm({ customer_name: '', customer_email: '', order_date: today(), amount: '', notes: '' })
    router.replace('/orders'); loadOrders()
  }

  const pendingCount = orders.filter(o => o.status === 'pending').length

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <div style={{ width: 4, height: 28, background: 'linear-gradient(180deg, #059669, #10b981)', borderRadius: 99 }} />
            <h1 className="page-title">ניהול הזמנות</h1>
          </div>
          <p className="page-subtitle" style={{ marginRight: 16 }}>
            {orders.length} הזמנות · <span style={{ color: '#d97706', fontWeight: 600 }}>{pendingCount} ממתינות</span>
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={16} /> הזמנה חדשה
        </button>
      </div>

      {/* New Order Form */}
      {showForm && (
        <div className="card" style={{ padding: 28, marginBottom: 24, borderTop: '3px solid #2d6aff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #2d6aff, #5c8cff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={16} color="white" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 16, color: '#0f1f3d' }}>הוספת הזמנה חדשה</span>
            </div>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9baabe', padding: 4 }}>
              <X size={20} />
            </button>
          </div>
          <form onSubmit={submitNew} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label className="label">שם לקוח *</label>
              <input className="input" value={form.customer_name} onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))} placeholder="שם החברה / הלקוח" required />
            </div>
            <div>
              <label className="label">מייל לקוח</label>
              <input className="input" type="email" value={form.customer_email} onChange={e => setForm(p => ({ ...p, customer_email: e.target.value }))} placeholder="email@example.com" />
            </div>
            <div>
              <label className="label">תאריך הזמנה *</label>
              <input className="input" type="date" value={form.order_date} onChange={e => setForm(p => ({ ...p, order_date: e.target.value }))} required />
            </div>
            <div>
              <label className="label">סכום (₪)</label>
              <input className="input" type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label">הערות</label>
              <textarea className="input" rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="הערות נוספות..." style={{ resize: 'vertical' }} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10 }}>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'שומר...' : 'הוסף הזמנה'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">ביטול</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={15} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#9baabe' }} />
            <input className="input" style={{ paddingRight: 36 }} placeholder="חיפוש לפי שם / מייל..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={14} style={{ color: '#9baabe' }} />
            <input className="input" type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ width: 150 }} />
            <span style={{ color: '#9baabe', fontSize: 13 }}>עד</span>
            <input className="input" type="date" value={to} onChange={e => setTo(e.target.value)} style={{ width: 150 }} />
          </div>
          <select className="input" value={status} onChange={e => setStatus(e.target.value)} style={{ width: 160 }}>
            <option value="all">כל הסטטוסים</option>
            <option value="pending">ממתין לאספקה</option>
            <option value="delivered">סופק</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 160px 90px',
          gap: 16, padding: '12px 24px',
          background: '#f8fafc', borderBottom: '1px solid #e8edf5',
          fontSize: 11, fontWeight: 700, color: '#9baabe', textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          <span>לקוח</span><span>תאריך</span><span>מקור</span><span>סטטוס</span><span>פעולות</span>
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#9baabe' }}>
            <div style={{ width: 36, height: 36, border: '3px solid #e0e9ff', borderTopColor: '#2d6aff', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
            טוען...
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#9baabe' }}>
            <Search size={40} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
            <p style={{ fontSize: 15, fontWeight: 600 }}>לא נמצאו הזמנות</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>נסה לשנות את פרמטרי הסינון</p>
          </div>
        ) : (
          orders.map((o, idx) => (
            <div key={o.id}>
              <div
                onClick={() => setExpand(expandedId === o.id ? null : o.id)}
                style={{
                  display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 160px 90px',
                  gap: 16, padding: '16px 24px', cursor: 'pointer',
                  borderBottom: '1px solid #f1f4fb',
                  background: expandedId === o.id ? '#f8fafc' : idx % 2 === 0 ? 'white' : '#fdfeff',
                  alignItems: 'center', transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (expandedId !== o.id) (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}
                onMouseLeave={e => { if (expandedId !== o.id) (e.currentTarget as HTMLElement).style.background = idx % 2 === 0 ? 'white' : '#fdfeff' }}
              >
                {/* Customer */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #e0e9ff, #f0f4ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 700, color: '#1a52db' }}>
                      {o.customer_name.charAt(0)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#0f1f3d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.customer_name}</div>
                      {o.customer_email && <div style={{ fontSize: 11, color: '#9baabe', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.customer_email}</div>}
                    </div>
                  </div>
                </div>

                {/* Date */}
                <div>
                  <div style={{ fontSize: 13, color: '#4a5f80', fontWeight: 500 }}>
                    {new Date(o.order_date).toLocaleDateString('he-IL')}
                  </div>
                  {o.received_at && (
                    <div style={{ fontSize: 11, color: '#9baabe', marginTop: 2 }}>
                      {new Date(o.received_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem' })}
                    </div>
                  )}
                </div>

                {/* Source */}
                <span>
                  {o.source === 'email'
                    ? <span className="badge-email"><Mail size={11} />מייל</span>
                    : <span className="badge-manual"><User size={11} />ידני</span>}
                </span>

                {/* Status */}
                <span>
                  {o.status === 'delivered'
                    ? <span className="badge-delivered"><Check size={11} />סופק</span>
                    : <span className="badge-pending">⏳ ממתין לאספקה</span>}
                </span>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
                  {o.status === 'pending' ? (
                    <>
                      <button onClick={() => markDelivered(o.id)} className="btn-success" style={{ fontSize: 12, padding: '6px 12px' }}>✓ סופק</button>
                      <button onClick={() => deleteOrder(o.id)} style={{ width: 32, height: 32, borderRadius: 8, background: '#fff5f7', border: '1px solid #fecdd3', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48' }}>
                        <Trash2 size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => markPending(o.id)} className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }}>↩ בטל סיפוק</button>
                      <button onClick={() => deleteOrder(o.id)} style={{ width: 32, height: 32, borderRadius: 8, background: '#fff5f7', border: '1px solid #fecdd3', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48' }}>
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Expanded row */}
              {expandedId === o.id && (
                <div style={{ padding: '16px 24px 20px 24px', background: '#f0f4ff', borderBottom: '1px solid #e0e9ff', borderRight: '3px solid #2d6aff', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(() => {
                    const files: string[] = JSON.parse(o.attachments || '[]')
                    return files.length > 0 ? (
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7a99', textTransform: 'uppercase', letterSpacing: '0.05em' }}>קבצים מצורפים</span>
                        <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                          {files.map(f => (
                            <a key={f} href={`/api/attachments/${f}`} target="_blank" rel="noopener noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#059669', color: 'white', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                              <FileText size={14} /> {f.replace(/^[^_]+_/, '')}
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : null
                  })()}
                  {o.email_subject && (
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7a99', textTransform: 'uppercase', letterSpacing: '0.05em' }}>נושא מייל</span>
                      <p style={{ fontSize: 13, color: '#1a3060', fontWeight: 600, marginTop: 3 }}>{o.email_subject}</p>
                    </div>
                  )}
                  {o.email_snippet && (
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7a99', textTransform: 'uppercase', letterSpacing: '0.05em' }}>תוכן ההודעה</span>
                      <div style={{ fontSize: 13, color: '#3d4f6e', marginTop: 3, lineHeight: 1.7, whiteSpace: 'pre-wrap', background: 'white', border: '1px solid #dde5f7', borderRadius: 10, padding: '10px 14px', maxHeight: 400, overflowY: 'auto' }}>
                        {renderEmailBody(o.email_snippet)}
                      </div>
                    </div>
                  )}
                  {o.notes && (
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7a99', textTransform: 'uppercase', letterSpacing: '0.05em' }}>הערות</span>
                      <p style={{ fontSize: 13, color: '#3d4f6e', marginTop: 3 }}>{o.notes}</p>
                    </div>
                  )}
                  {!o.email_subject && !o.email_snippet && !o.notes && (
                    <p style={{ fontSize: 13, color: '#9baabe' }}>אין פרטים נוספים להצגה</p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div style={{ padding: 60, textAlign: 'center', color: '#9baabe' }}>טוען...</div>}>
      <OrdersInner />
    </Suspense>
  )
}
