import { NextResponse } from 'next/server'
import { getSetting } from '@/lib/db'
import { sendEmail } from '@/lib/sendEmail'
import * as imapSimple from 'imap-simple'

export const dynamic = 'force-dynamic'

export async function POST() {
  const email    = getSetting('imap_email')
  const password = getSetting('imap_password')

  if (!email || !password) {
    return NextResponse.json({ success: false, error: 'לא הוזנו פרטי חיבור. שמור קודם את האימייל והסיסמה.' })
  }

  // Test IMAP connection
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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('AUTHENTICATIONFAILED') || msg.includes('Invalid credentials')) {
      return NextResponse.json({ success: false, error: 'סיסמה שגויה. ודא שהכנסת App Password תקין.' })
    }
    return NextResponse.json({ success: false, error: `שגיאת חיבור: ${msg}` })
  }

  // Send confirmation email
  try {
    await sendEmail({
      email,
      password,
      to: email,
      subject: '✅ AirPak — החיבור הצליח!',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; padding: 32px; border: 1px solid #e0e7ff; border-radius: 16px; background: #f8faff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="font-size: 48px;">📦</div>
            <h1 style="color: #1a52db; font-size: 22px; margin: 8px 0;">AirPak מחוברת בהצלחה!</h1>
          </div>
          <p style="color: #374151; font-size: 15px; line-height: 1.7;">
            שלום,<br><br>
            המערכת מחוברת לתיבת הדואר שלך ומוכנה למשוך הזמנות נכנסות.
          </p>
          <div style="background: #e0e7ff; border-radius: 10px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #1a52db; font-size: 14px; font-weight: bold;">מה קורה עכשיו?</p>
            <ul style="margin: 8px 0 0 0; padding-right: 20px; color: #374151; font-size: 14px; line-height: 1.8;">
              <li>המערכת תסרוק אוטומטית מיילים חדשים</li>
              <li>הזמנות שיזוהו יתווספו אוטומטית למערכת</li>
              <li>תוכל גם לסנכרן ידנית מדף ההגדרות</li>
            </ul>
          </div>
          <p style="color: #9baabe; font-size: 12px; text-align: center; margin-top: 24px;">
            AirPak — מערכת ניהול הזמנות
          </p>
        </div>
      `,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ success: false, error: `החיבור IMAP הצליח אך שליחת המייל נכשלה: ${msg}` })
  }

  return NextResponse.json({ success: true })
}
