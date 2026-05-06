'use client'
import { useEffect, useState } from 'react'
import { Save, Mail, Bell, RefreshCw, CheckCircle, ExternalLink, Shield, Eye, EyeOff, Wifi } from 'lucide-react'

interface SettingsForm {
  alert_days: string
  imap_email: string
  imap_password: string
  last_email_sync: string
}

export default function SettingsPage() {
  const [form, setForm]           = useState<SettingsForm>({ alert_days: '4', imap_email: '', imap_password: '', last_email_sync: '' })
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [syncing, setSyncing]     = useState(false)
  const [syncResult, setSyncResult] = useState<{ msg: string; ok: boolean } | null>(null)
  const [showPass, setShowPass]   = useState(false)
  const [testing, setTesting]     = useState(false)
  const [testResult, setTestResult] = useState<{ msg: string; ok: boolean } | null>(null)

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => setForm(p => ({ ...p, ...d })))
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    await fetch('/api/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000)
  }

  const syncNow = async () => {
    setSyncing(true); setSyncResult(null)
    const res = await fetch('/api/email/sync', { method: 'POST' }).then(r => r.json())
    if (res.error) setSyncResult({ msg: res.error, ok: false })
    else setSyncResult({ msg: `✓ נוספו ${res.added} הזמנות (${res.skipped} נסרקו)`, ok: true })
    setSyncing(false)
    fetch('/api/settings').then(r => r.json()).then(d => setForm(p => ({ ...p, ...d })))
  }

  const testConnection = async () => {
    setTesting(true); setTestResult(null)
    const res = await fetch('/api/email/test', { method: 'POST' }).then(r => r.json())
    if (res.success) setTestResult({ msg: '✓ החיבור הצליח!', ok: true })
    else setTestResult({ msg: res.error ?? 'שגיאה לא ידועה', ok: false })
    setTesting(false)
  }

  return (
    <div className="page-container" style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <div style={{ width: 4, height: 28, background: 'linear-gradient(180deg, #6b7a99, #9baabe)', borderRadius: 99 }} />
          <h1 className="page-title">הגדרות</h1>
        </div>
        <p className="page-subtitle" style={{ marginRight: 16 }}>חיבור Gmail והגדרות התראות</p>
      </div>

      <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Gmail Connection */}
        <div className="card" style={{ padding: 28, borderTop: '3px solid #2d6aff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: 'linear-gradient(135deg, #1a52db, #2d6aff)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(45,106,255,0.3)' }}>
              <Mail size={22} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, color: '#0f1f3d' }}>חיבור Gmail</div>
              <div style={{ fontSize: 12, color: '#9baabe' }}>סריקה אוטומטית של הזמנות נכנסות</div>
            </div>
          </div>

          {/* Step-by-step guide */}
          <div style={{ background: '#f0f4ff', border: '1px solid #bfccff', borderRadius: 14, padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Shield size={15} color="#2d6aff" />
              <span style={{ fontWeight: 700, fontSize: 14, color: '#1a52db' }}>איך מחברים? — 3 דקות, פעם אחת</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                {
                  n: '1',
                  text: 'כנס לחשבון Google שלך',
                  link: { label: 'myaccount.google.com ←', href: 'https://myaccount.google.com/security' },
                },
                {
                  n: '2',
                  text: 'חפש "אימות דו-שלבי" — ודא שהוא מופעל (רוב החשבונות כבר מופעל)',
                  link: null,
                },
                {
                  n: '3',
                  text: 'חפש "סיסמאות לאפליקציות" → צור סיסמה חדשה → קרא לה "AirPak"',
                  link: { label: 'קיצור דרך ←', href: 'https://myaccount.google.com/apppasswords' },
                },
                {
                  n: '4',
                  text: 'תקבל 16 תווים כמו: "abcd efgh ijkl mnop" — העתק אותם והכנס למטה',
                  link: null,
                },
              ].map(step => (
                <div key={step.n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#2d6aff', color: 'white', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    {step.n}
                  </div>
                  <div style={{ fontSize: 13, color: '#3d4f6e', lineHeight: 1.6 }}>
                    {step.text}
                    {step.link && (
                      <> &nbsp;
                        <a href={step.link.href} target="_blank" rel="noopener" style={{ color: '#2d6aff', fontWeight: 600, textDecoration: 'none' }}>
                          {step.link.label} <ExternalLink size={11} style={{ display: 'inline', verticalAlign: 'middle' }} />
                        </a>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="label">כתובת Gmail</label>
              <input
                className="input"
                type="email"
                value={form.imap_email}
                onChange={e => setForm(p => ({ ...p, imap_email: e.target.value }))}
                placeholder="yourname@gmail.com"
                dir="ltr"
              />
            </div>
            <div>
              <label className="label">סיסמת אפליקציה (App Password)</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPass ? 'text' : 'password'}
                  value={form.imap_password}
                  onChange={e => setForm(p => ({ ...p, imap_password: e.target.value }))}
                  placeholder="abcd efgh ijkl mnop"
                  dir="ltr"
                  style={{ paddingLeft: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9baabe' }}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p style={{ fontSize: 11, color: '#9baabe', marginTop: 5 }}>
                ניתן להוסיף עם רווחים או בלי — המערכת תתעלם מהם אוטומטית
              </p>
            </div>
          </div>

          {form.last_email_sync && (
            <p style={{ fontSize: 12, color: '#9baabe', marginTop: 14 }}>
              🕐 סנכרון אחרון: {new Date(form.last_email_sync).toLocaleString('he-IL')}
            </p>
          )}

          {/* Test connection button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 18 }}>
            <button type="button" onClick={testConnection} disabled={testing} className="btn-primary" style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
              <Wifi size={15} style={testing ? { animation: 'spin 0.8s linear infinite' } : {}} />
              {testing ? 'בודק חיבור...' : 'בדוק חיבור'}
            </button>
            {testResult && (
              <span style={{ fontSize: 13, fontWeight: 600, color: testResult.ok ? '#10b981' : '#e11d48' }}>
                {testResult.msg}
              </span>
            )}
          </div>

          {/* Sync button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 12 }}>
            <button type="button" onClick={syncNow} disabled={syncing} className="btn-secondary">
              <RefreshCw size={15} style={syncing ? { animation: 'spin 0.8s linear infinite' } : {}} />
              {syncing ? 'סורק מיילים...' : 'סנכרן עכשיו'}
            </button>
            {syncResult && (
              <span style={{ fontSize: 13, fontWeight: 600, color: syncResult.ok ? '#10b981' : '#e11d48' }}>
                {syncResult.msg}
              </span>
            )}
          </div>
        </div>

        {/* Alert days */}
        <div className="card" style={{ padding: 28, borderTop: '3px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: 'linear-gradient(135deg, #d97706, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }}>
              <Bell size={22} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, color: '#0f1f3d' }}>הגדרות התראות</div>
              <div style={{ fontSize: 12, color: '#9baabe' }}>מתי להתריע על הזמנה שלא טופלה</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div>
              <label className="label">ימים עד התראה</label>
              <input
                className="input"
                type="number" min="1" max="30"
                value={form.alert_days}
                onChange={e => setForm(p => ({ ...p, alert_days: e.target.value }))}
                style={{ width: 100 }}
              />
            </div>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#92400e', flex: 1 }}>
              אם הזמנה לא סומנה "סופק" תוך <b>{form.alert_days} ימים</b> — תופיע התראה אוטומטית
            </div>
          </div>
        </div>

        {/* Save */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button type="submit" disabled={saving} className="btn-primary" style={{ fontSize: 15, padding: '12px 28px' }}>
            <Save size={16} /> {saving ? 'שומר...' : 'שמור הגדרות'}
          </button>
          {saved && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontWeight: 700, fontSize: 14 }}>
              <CheckCircle size={17} /> נשמר!
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
