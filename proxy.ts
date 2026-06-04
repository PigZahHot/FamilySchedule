import { NextRequest, NextResponse } from 'next/server'

export function proxy(req: NextRequest) {
    const cookie = req.cookies.get('family_session')
    const isValid = cookie?.value === process.env.FAMILY_PASSPHRASE

    const isLoginPage = req.nextUrl.pathname === '/login'
    const isApiLogin = req.nextUrl.pathname === '/api/auth/login'

    // Let login page and login API through freely
    if (isLoginPage || isApiLogin) {
        return NextResponse.next()
    }

    // Block everything else if no valid session
    if (!isValid) {
        return NextResponse.redirect(new URL('/login', req.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}