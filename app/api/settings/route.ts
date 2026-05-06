import { NextRequest, NextResponse } from 'next/server'
import { getSetting, setSetting } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    alert_days:     getSetting('alert_days'),
    imap_email:     getSetting('imap_email'),
    imap_password:  getSetting('imap_password') ? '••••••••••••••••' : '',
    last_email_sync: getSetting('last_email_sync'),
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  if (body.alert_days)    setSetting('alert_days',    String(body.alert_days))
  if (body.imap_email)    setSetting('imap_email',    String(body.imap_email))
  if (body.imap_password && body.imap_password !== '••••••••••••••••')
                          setSetting('imap_password', String(body.imap_password))
  return NextResponse.json({ success: true })
}
