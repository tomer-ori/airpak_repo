import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  const correct = process.env.APP_PASSWORD ?? 'airpak123'

  if (password !== correct) {
    return NextResponse.json({ error: 'סיסמה שגויה' }, { status: 401 })
  }

  const res = NextResponse.json({ success: true })
  res.cookies.set('airpak_auth', correct, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.delete('airpak_auth')
  return res
}
