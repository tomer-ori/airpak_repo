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
  // מוצרי אריזה — עברית
  'שקית', 'שקיות', 'ניילון', 'ניילונים', 'פצפצים', 'פצפץ',
  'קרטון', 'קרטונים', 'בקבוק', 'בקבוקים', 'אריזה', 'אריזות',
  'כלי אוכל', 'צלחות', 'כוסות חד פעמי', 'מגשים', 'סכום חד פעמי',
  'שקית ניילון', 'שקית זיפ', 'שקית בועות', 'טפט בועות',
  'קופסה', 'קופסאות', 'מעטפה', 'מעטפות', 'גליל', 'גלילים',
  'סרט הדבקה', 'סרט אריזה', "סטרץ'", 'סטרץ',
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
  return found.reduce((a, b) => a + b, 0)
}
