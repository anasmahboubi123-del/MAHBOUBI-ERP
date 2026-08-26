import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

type Role = 'admin' | 'seller' | 'tailor'

const PROTECTED_PATTERNS = [
  { prefix: '/admin/', role: 'admin' as Role },
  { prefix: '/seller/', role: 'seller' as Role },
  { prefix: '/tailor/', role: 'tailor' as Role },
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // تجاهل الملفات الثابتة
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/images') ||
    pathname.match(/\.(jpg|jpeg|png|css|js|json|svg|ico)$/)
  ) {
    return NextResponse.next()
  }

  for (const { prefix, role } of PROTECTED_PATTERNS) {
    if (pathname.startsWith(prefix)) {
      const cookie = request.cookies.get(`auth_${role}`)
      if (cookie?.value !== '1') {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/seller/:path*', '/tailor/:path*'],
}