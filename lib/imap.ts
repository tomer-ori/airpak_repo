import * as imapSimple from 'imap-simple'
import { simpleParser } from 'mailparser'
import { getDb, getSetting, setSetting } from './db'
import path from 'path'
import fs from 'fs'

const ATTACHMENTS_DIR = path.join(process.cwd(), 'data', 'attachments')
if (!fs.existsSync(ATTACHMENTS_DIR)) fs.mkdirSync(ATTACHMENTS_DIR, { recursive: true })

const ORDER_KEYWORDS = [
  // מוצרי אריזה — עברית
  'שקית', 'שקיות', 'ניילון', 'ניילונים', 'פצפצים', 'פצפץ',
  'קרטון', 'קרטונים', 'בקבוק', 'בקבוקים', 'אריזה', 'אריזות',
  'כלי אוכל', 'צלחות', 'כוסות חד פעמי', 'מגשים', 'סכום חד פעמי',
  'שקית ניילון', 'שקית זיפ', 'שקית בועות', 'טפט בועות',
  'קופסה', 'קופסאות', 'מעטפה', 'מעטפות', 'גליל', 'גלילים',
  'סרט הדבקה', 'סרט אריזה', 'סטרץ\'', 'סטרץ',
  // מוצרי אריזה — אנגלית
  'packaging', 'package', 'bags', 'bag', 'nylon', 'bubble wrap',
  'carton', 'cartons', 'bottle', 'bottles', 'box', 'boxes',
  'shrink wrap', 'stretch film', 'tape', 'envelope', 'envelopes',
  'airpak',
  // הזמנה כללית — עברית (הטיות)
  'הזמנה', 'הזמנות',          // הזמנה / הזמנות
  'הזמנת',                     // הזמנת מוצרים, הזמנת לקוח
  'הזמנתי', 'הזמנתך', 'הזמנתכם', 'הזמנתו', 'הזמנתה', 'הזמנתנו', // ההטיות האישיות
  'להזמין', 'מזמין', 'מזמינה', 'מזמינים', // פועל
  'הוזמן', 'הוזמנה',           // סביל
  'הצעת מחיר', 'כמות', 'מחיר ליחידה',
  // הזמנה כללית — אנגלית
  'order', 'orders', 'purchase order', 'order confirmation',
]

const BLOCKED_SENDERS = [
  'noreply@', 'no-reply@', 'mailer@', 'notifications@',
  'donotreply@', 'do-not-reply@', 'newsletter@', 'news@',
  'accounts@google.com', 'info@youtube.com', 'noreply@youtube.com',
  'noreply@google.com', 'account-security-noreply@accountprotection.microsoft.com',
  'noreply@facebook.com', 'notification@facebookmail.com',
  'noreply@linkedin.com', 'noreply@twitter.com',
  'noreply@apple.com', 'noreply@amazon.com',
  'noreply@netflix.com', 'noreply@spotify.com',
]

const BLOCKED_SUBJECT_KEYWORDS = [
  'unsubscribe', 'newsletter',
  'verify your email', 'confirm your email', 'reset your password',
  'security alert', 'sign-in attempt', 'new device signed in',
  'google play', 'google account',
  'ניוזלטר', 'אפס סיסמה',
  'airpak — החיבור הצליח', // מייל אישור חיבור פנימי
]

function isBlockedEmail(from: string, subject: string): boolean {
  const fromLower = from.toLowerCase()
  const subjectLower = subject.toLowerCase()
  if (BLOCKED_SENDERS.some(s => fromLower.includes(s))) return true
  if (BLOCKED_SUBJECT_KEYWORDS.some(k => subjectLower.includes(k))) return true
  return false
}

function extractAmount(text: string): number {
  // אם יש סה"כ מפורש — זה כבר הסכום הסופי, משתמשים בו ישירות
  const totalPatterns = [
    /סה"כ[:\s]*(\d[\d,]*(?:\.\d{1,2})?)/,
    /סה״כ[:\s]*(\d[\d,]*(?:\.\d{1,2})?)/,
    /סכום סופי[:\s]*(\d[\d,]*(?:\.\d{1,2})?)/,
    /total[:\s]+(\d[\d,]*(?:\.\d{1,2})?)/i,
    /grand total[:\s]*(\d[\d,]*(?:\.\d{1,2})?)/i,
  ]
  for (const p of totalPatterns) {
    const m = text.match(p)
    if (m) return parseFloat(m[1].replace(/,/g, ''))
  }

  // אין סה"כ — מוצאים את כל המחירים ומסכמים
  const pricePatterns = [
    /₪\s*(\d[\d,]*(?:\.\d{1,2})?)/g,
    /(\d[\d,]*(?:\.\d{1,2})?)\s*(?:ש"ח|ש״ח|שח|ils|nis)(?=\s|$|,)/gi,
    /\$\s*(\d[\d,]*(?:\.\d{1,2})?)/g,
  ]
  const found: number[] = []
  for (const p of pricePatterns) {
    for (const m of text.matchAll(p)) {
      const val = parseFloat(m[1].replace(/,/g, ''))
      if (val > 0) found.push(val)
    }
  }
  if (found.length === 0) return 0
  // אם יש מספר מחירים — מסכמים הכל
  return found.reduce((a, b) => a + b, 0)
}

function parseSender(from: string): { name: string; email: string } {
  const match = from.match(/^"?([^"<]+)"?\s*<([^>]+)>$/)
  if (match) return { name: match[1].trim(), email: match[2].trim() }
  const emailOnly = from.match(/([^\s@]+@[^\s@]+\.[^\s@]+)/)
  return { name: '', email: emailOnly?.[1] ?? from }
}

export async function syncViaImap(): Promise<{ added: number; skipped: number; error?: string }> {
  const email    = getSetting('imap_email')
  const password = getSetting('imap_password')

  if (!email || !password) {
    return { added: 0, skipped: 0, error: 'לא הוגדרו פרטי Gmail. אנא הגדר בדף ההגדרות.' }
  }

  const config = {
    imap: {
      user: email,
      password,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 10000,
    },
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let connection: any = null

  try {
    connection = await imapSimple.connect(config)
    await connection.openBox('INBOX')

    const lastSync = getSetting('last_email_sync')
    const since = lastSync
      ? new Date(lastSync)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const sinceStr = since.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })

    const messages = await connection.search(['ALL', ['SINCE', sinceStr]], {
      bodies: ['HEADER', 'TEXT', ''],
      markSeen: false,
    })

    const db = getDb()
    const checkExisting = db.prepare('SELECT id FROM orders WHERE gmail_message_id = ? UNION SELECT 1 FROM blocked_emails WHERE gmail_message_id = ?')
    const insertOrder   = db.prepare(`
      INSERT INTO orders (customer_name, customer_email, order_date, received_at, amount, source, email_subject, email_snippet, gmail_message_id, attachments)
      VALUES (?, ?, ?, ?, ?, 'email', ?, ?, ?, ?)
    `)

    let added = 0, skipped = 0

    for (const msg of messages) {
      const uid = String(msg.attributes.uid)
      if (checkExisting.get(uid, uid)) { skipped++; continue }

      const all = msg.parts.find(p => p.which === '')
      if (!all) { skipped++; continue }

      const parsed = await simpleParser(all.body as string)
      const subject = parsed.subject ?? ''
      const text    = parsed.text ?? ''
      const html    = parsed.html ?? ''
      const body    = text || html.replace(/<[^>]+>/g, '')

      const fromAddr = parsed.from?.text ?? ''
      if (isBlockedEmail(fromAddr, subject)) { skipped++; continue }

      const fullText = `${subject} ${body.slice(0, 500)}`.toLowerCase()
      const isOrder  = ORDER_KEYWORDS.some(k => fullText.includes(k.toLowerCase()))
      if (!isOrder) { skipped++; continue }

      // שמירת PDF attachments לדיסק
      const savedFiles: string[] = []
      for (const att of parsed.attachments ?? []) {
        const isPdf = att.contentType === 'application/pdf' ||
                      (att.filename ?? '').toLowerCase().endsWith('.pdf')
        if (!isPdf) continue
        const safeName = `${uid}_${(att.filename ?? 'attachment.pdf').replace(/[^a-zA-Z0-9._-]/g, '_')}`
        fs.writeFileSync(path.join(ATTACHMENTS_DIR, safeName), att.content)
        savedFiles.push(safeName)
      }

      const { name, email: fromEmail } = parseSender(fromAddr)
      const emailDate  = parsed.date ?? new Date()
      const orderDate  = emailDate.toISOString().slice(0, 10)
      const receivedAt = emailDate.toISOString()
      const amount     = extractAmount(`${subject} ${body}`)

      insertOrder.run(
        name || fromEmail || 'לא ידוע',
        fromEmail,
        orderDate,
        receivedAt,
        amount,
        subject.slice(0, 255),
        body,
        uid,
        JSON.stringify(savedFiles),
      )
      added++
    }

    setSetting('last_email_sync', new Date().toISOString())
    connection.end()
    return { added, skipped }

  } catch (err: unknown) {
    connection?.end()
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('AUTHENTICATIONFAILED') || msg.includes('Invalid credentials')) {
      return { added: 0, skipped: 0, error: 'סיסמה שגויה. ודא שהכנסת App Password נכון.' }
    }
    return { added: 0, skipped: 0, error: msg }
  }
}
