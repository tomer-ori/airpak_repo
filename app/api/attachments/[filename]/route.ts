import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

export async function GET(_req: NextRequest, { params }: { params: { filename: string } }) {
  const filename = params.filename.replace(/\.\./g, '')
  const filePath = path.join(process.cwd(), 'data', 'attachments', filename)

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'קובץ לא נמצא' }, { status: 404 })
  }

  const buffer = fs.readFileSync(filePath)
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename.replace(/^[^_]+_/, '')}"`,
    },
  })
}
