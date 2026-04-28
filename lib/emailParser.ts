import { gmail_v1 } from 'googleapis'

interface ParsedOrder {
  customerName: string
  customerEmail: string
  orderDate: string
  amount: number
  subject: string
  snippet: string
}

const ORDER_KEYWORDS = [
  'הזמנה', 'order', 'purchase', 'רכישה', 'הצעת מחיר', 'quote',
  'אריזה', 'packaging', 'airpak', 'supply', 'אספקה', 'delivery',
  'פקודה', 'הזמנת', 'מוצר', 'product', 'כמות', 'quantity',
]

export function parseEmailOrder(msg: gmail_v1.Schema$Message): ParsedOrder | null {
  const headers = msg.payload?.headers ?? []
  const subject = getHeader(headers, 'Subject') ?? ''
  const from = getHeader(headers, 'From') ?? ''
  const date = getHeader(headers, 'Date') ?? ''
  const snippet = msg.snippet ?? ''

  const fullText = `${subject} ${snippet}`.toLowerCase()
  const isOrder = ORDER_KEYWORDS.some(k => fullText.includes(k.toLowerCase()))
  if (!isOrder) return null

  const { name, email } = parseSender(from)
  const orderDate = parseDate(date)
  const amount = extractAmount(snippet + ' ' + subject)

  return {
    customerName: name || email || 'לא ידוע',
    customerEmail: email,
    orderDate,
    amount,
    subject: subject.slice(0, 255),
    snippet: snippet.slice(0, 500),
  }
}

function getHeader(headers: gmail_v1.Schema$MessagePartHeader[], name: string): string | null {
  return headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value ?? null
}

function parseSender(from: string): { name: string; email: string } {
  const match = from.match(/^"?([^"<]+)"?\s*<([^>]+)>$/)
  if (match) return { name: match[1].trim(), email: match[2].trim() }
  const emailOnly = from.match(/([^\s@]+@[^\s@]+\.[^\s@]+)/)
  return { name: '', email: emailOnly?.[1] ?? from }
}

function parseDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  } catch {}
  return new Date().toISOString().slice(0, 10)
}

function extractAmount(text: string): number {
  const patterns = [
    /₪\s*(\d[\d,]*(?:\.\d{1,2})?)/,
    /(\d[\d,]*(?:\.\d{1,2})?)\s*(?:ש"ח|שח|ils|nis)/i,
    /\$\s*(\d[\d,]*(?:\.\d{1,2})?)/,
    /total[:\s]+(\d[\d,]*(?:\.\d{1,2})?)/i,
    /סה"כ[:\s]*(\d[\d,]*(?:\.\d{1,2})?)/,
    /סכום[:\s]*(\d[\d,]*(?:\.\d{1,2})?)/,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) return parseFloat(m[1].replace(/,/g, ''))
  }
  return 0
}
