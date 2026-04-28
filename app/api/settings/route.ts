import { NextRequest, NextResponse } from 'next/server'
import { getDb, getSetting, setSetting } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const keys = ['alert_days', 'gmail_client_id', 'gmail_client_secret', 'gmail_refresh_token', 'gmail_email', 'last_email_sync']
  const result: Record<string, string> = {}
  for (const k of keys) result[k] = getSetting(k)
  result.gmail_client_secret = result.gmail_client_secret ? '••••••••' : ''
  result.gmail_refresh_token = result.gmail_refresh_token ? '••••••••' : ''
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const allowed = ['alert_days', 'gmail_client_id', 'gmail_client_secret', 'gmail_refresh_token', 'gmail_email']
  for (const [k, v] of Object.entries(body)) {
    if (allowed.includes(k) && v !== '••••••••') setSetting(k, String(v))
  }
  return NextResponse.json({ success: true })
}
