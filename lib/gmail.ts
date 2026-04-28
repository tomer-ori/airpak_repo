import { google } from 'googleapis'
import { getSetting } from './db'
import { parseEmailOrder } from './emailParser'

export function getGmailClient() {
  const clientId = getSetting('gmail_client_id')
  const clientSecret = getSetting('gmail_client_secret')
  const refreshToken = getSetting('gmail_refresh_token')

  if (!clientId || !clientSecret || !refreshToken) return null

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, 'urn:ietf:wg:oauth:2.0:oob')
  oauth2.setCredentials({ refresh_token: refreshToken })
  return google.gmail({ version: 'v1', auth: oauth2 })
}

export async function syncEmailOrders(): Promise<{ added: number; skipped: number; error?: string }> {
  const gmail = getGmailClient()
  if (!gmail) return { added: 0, skipped: 0, error: 'Gmail לא מוגדר. אנא הגדר פרטי חיבור בדף ההגדרות.' }

  const { getDb, setSetting } = await import('./db')
  const db = getDb()

  try {
    const lastSync = getSetting('last_email_sync')
    const query = lastSync ? `after:${Math.floor(new Date(lastSync).getTime() / 1000)}` : 'newer_than:30d'

    const listRes = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 100,
    })

    const messages = listRes.data.messages ?? []
    let added = 0
    let skipped = 0

    const checkExisting = db.prepare('SELECT id FROM orders WHERE gmail_message_id = ?')
    const insertOrder = db.prepare(`
      INSERT INTO orders (customer_name, customer_email, order_date, amount, source, email_subject, email_snippet, gmail_message_id)
      VALUES (?, ?, ?, ?, 'email', ?, ?, ?)
    `)

    for (const msg of messages) {
      if (!msg.id) continue
      const existing = checkExisting.get(msg.id)
      if (existing) { skipped++; continue }

      const detail = await gmail.users.messages.get({ userId: 'me', id: msg.id, format: 'full' })
      const parsed = parseEmailOrder(detail.data)
      if (!parsed) { skipped++; continue }

      insertOrder.run(
        parsed.customerName,
        parsed.customerEmail,
        parsed.orderDate,
        parsed.amount,
        parsed.subject,
        parsed.snippet,
        msg.id,
      )
      added++
    }

    setSetting('last_email_sync', new Date().toISOString())
    return { added, skipped }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { added: 0, skipped: 0, error: msg }
  }
}
