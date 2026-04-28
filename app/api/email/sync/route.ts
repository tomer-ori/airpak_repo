import { NextResponse } from 'next/server'
import { syncEmailOrders } from '@/lib/gmail'
import { checkAndCreateAlerts } from '@/lib/alertChecker'

export async function POST() {
  const result = await syncEmailOrders()
  if (result.added > 0) checkAndCreateAlerts()
  return NextResponse.json(result)
}
