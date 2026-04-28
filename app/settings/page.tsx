'use client'
import { useEffect, useState } from 'react'
import { Save, Mail, Bell, RefreshCw, ExternalLink, Shield, CheckCircle } from 'lucide-react'

interface SettingsForm {
  alert_days: string; gmail_client_id: string; gmail_client_secret: string
  gmail_refresh_token: string; gmail_email: string; last_email_sync: string
}

export default function SettingsPage() {
  const [form, setForm]       = useState<SettingsForm>({ alert_days: '4', gmail_client_id: '', gmail_client_secret: '', gmail_refresh_token: '', gmail_email: '', last_email_sync: '' })
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState('')

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => setForm(prev => ({ ...prev, ...d })))
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000)
  }

  const syncNow = async () => {
    setSyncing(true); setSyncResult('')
    const res = await fetch('/api/email/sync', { method: 'POST' }).then(r => r.json())
    setSyncResult(res.error ? `שגיאה: ${res.error}` : `נוספו ${res.added} הזמנות (${res.skipped} דולגו)`)
    setSyncing(false)
    fetch('/api/settings').then(r => r.json()).then(d => setForm(prev => ({ ...prev, ...d })))
  }

  return (
    <div className="page-container" style={{ maxWidth: 720 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <div style={{ width: 4, height: 28, background: 'linear-gradient(180deg, #6b7a99, #9baabe)', borderRadius: 99 }} />
          <h1 className="page-title">הגדרות</h1>
        </div>
        <p className="page-subtitle" style={{ marginRight: 16 }}>הגדר חיבור לג׳ימייל ופרמטרי התראות</p>
      </div>

      <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Alert Settings */}
        <div className="card" style={{ padding: 28, borderTop: '3px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
            <div style={{ width: 42, height: 42, borderRadius: 13, background: 'linear-gradient(135deg, #d97706, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }}>
              <Bell size={20} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#0f1f3d' }}>הגדרות התראות</div>
              <div style={{ fontSize: 12, color: '#9baabe' }}>מתי לשלוח התראות על הזמנות שלא טופלו</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
            <div style={{ flex: 1 }}>
              <label className="label">ימים עד התראה</label>
              <input className="input" type="number" min="1" max="30" value={form.alert_days} onChange={e => setForm(p => ({ ...p, alert_days: e.target.value }))} style={{ maxWidth: 140 }} />
            </div>
            <div style={{ flex: 2, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '14px 18px', fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>
              <b>⏰ כרגע:</b> כל הזמנה שלא סומנה כ"סופק" תוך <b>{form.alert_days} ימים</b> תופיע בעמוד ההתראות ותספור כהתראה פעילה.
            </div>
          </div>
        </div>

        {/* Gmail Settings */}
        <div className="card" style={{ padding: 28, borderTop: '3px solid #2d6aff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 42, height: 42, borderRadius: 13, background: 'linear-gradient(135deg, #1a52db, #2d6aff)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(45,106,255,0.3)' }}>
              <Mail size={20} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#0f1f3d' }}>חיבור Gmail</div>
              <div style={{ fontSize: 12, color: '#9baabe' }}>סנכרון הזמנות אוטומטי מהמייל</div>
            </div>
          </div>

          {/* Instructions */}
          <div style={{ background: '#f0f4ff', border: '1px solid #bfccff', borderRadius: 14, padding: 18, marginBottom: 22, marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Shield size={14} color="#2d6aff" />
              <span style={{ fontWeight: 700, fontSize: 13, color: '#1a52db' }}>הגדרה חד-פעמית – שלבים:</span>
            </div>
            <ol style={{ fontSize: 13, color: '#3d4f6e', lineHeight: 1.8, paddingRight: 16, margin: 0 }}>
              <li>כנס ל-<a href="https://console.cloud.google.com/" target="_blank" rel="noopener" style={{ color: '#2d6aff', fontWeight: 600 }}>Google Cloud Console <ExternalLink size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /></a></li>
              <li>צור פרויקט חדש, הפעל <b>Gmail API</b></li>
              <li>צור <b>OAuth2 Credentials</b> (Desktop application)</li>
              <li>הרץ את הסקריפט שמורשה פעם אחת כדי לקבל Refresh Token</li>
              <li>הכנס את הפרטים כאן ולחץ שמור</li>
            </ol>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label">כתובת Gmail לסריקה</label>
              <input className="input" type="email" value={form.gmail_email} onChange={e => setForm(p => ({ ...p, gmail_email: e.target.value }))} placeholder="yourname@gmail.com" />
            </div>
            <div>
              <label className="label">Client ID</label>
              <input className="input" value={form.gmail_client_id} onChange={e => setForm(p => ({ ...p, gmail_client_id: e.target.value }))} placeholder="xxxxxxxxxx.apps.googleusercontent.com" />
            </div>
            <div>
              <label className="label">Client Secret</label>
              <input className="input" type="password" value={form.gmail_client_secret} onChange={e => setForm(p => ({ ...p, gmail_client_secret: e.target.value }))} placeholder="GOCSPX-..." />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label">Refresh Token</label>
              <input className="input" type="password" value={form.gmail_refresh_token} onChange={e => setForm(p => ({ ...p, gmail_refresh_token: e.target.value }))} placeholder="1//04..." />
            </div>
          </div>

          {form.last_email_sync && (
            <p style={{ fontSize: 12, color: '#9baabe', marginTop: 14 }}>
              🕐 סנכרון אחרון: {new Date(form.last_email_sync).toLocaleString('he-IL')}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 18 }}>
            <button type="button" onClick={syncNow} disabled={syncing} className="btn-secondary">
              <RefreshCw size={15} style={syncing ? { animation: 'spin 0.8s linear infinite' } : {}} />
              {syncing ? 'מסנכרן...' : 'סנכרן עכשיו'}
            </button>
            {syncResult && (
              <span style={{ fontSize: 13, fontWeight: 600, color: syncResult.startsWith('שגיאה') ? '#e11d48' : '#10b981' }}>
                {syncResult}
              </span>
            )}
          </div>
        </div>

        {/* Save */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button type="submit" disabled={saving} className="btn-primary" style={{ fontSize: 15, padding: '12px 28px' }}>
            <Save size={16} /> {saving ? 'שומר...' : 'שמור הגדרות'}
          </button>
          {saved && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontWeight: 600, fontSize: 14 }}>
              <CheckCircle size={16} /> נשמר בהצלחה!
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
