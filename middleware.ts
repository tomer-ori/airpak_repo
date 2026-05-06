import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const auth = req.cookies.get('airpak_auth')?.value
  const password = process.env.APP_PASSWORD ?? 'airpak123'

  if (auth !== password) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!login|api/auth|_next/static|_next/image|favicon\\.ico).*)'],
}
