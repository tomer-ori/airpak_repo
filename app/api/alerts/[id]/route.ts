import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb()
  const id = parseInt(params.id)
  db.prepare('UPDATE alerts SET is_resolved = 1 WHERE id = ?').run(id)
  return NextResponse.json({ success: true })
}
