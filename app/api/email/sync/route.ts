import { NextResponse } from 'next/server'
import { syncViaImap } from '@/lib/imap'
import { checkAndCreateAlerts } from '@/lib/alertChecker'

export const dynamic = 'force-dynamic'

export async function POST() {
  const result = await syncViaImap()
  if (result.added > 0) checkAndCreateAlerts()
  return NextResponse.json(result)
}
