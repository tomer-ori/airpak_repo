import { NextResponse } from 'next/server'
import { getSetting } from '@/lib/db'
import * as imapSimple from 'imap-simple'

export const dynamic = 'force-dynamic'

export async function POST() {
  const email    = getSetting('imap_email')
  const password = getSetting('imap_password')

  if (!email || !password) {
    return NextResponse.json({ success: false, error: 'לא הוזנו פרטי חיבור. שמור קודם את האימייל והסיסמה.' })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let connection: any = null
  try {
    connection = await imapSimple.connect({
      imap: {
        user: email,
        password,
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 10000,
      },
    })
    connection.end()
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('AUTHENTICATIONFAILED') || msg.includes('Invalid credentials')) {
      return NextResponse.json({ success: false, error: 'סיסמה שגויה. ודא שהכנסת App Password תקין.' })
    }
    return NextResponse.json({ success: false, error: `שגיאת חיבור: ${msg}` })
  }
}
