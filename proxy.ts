import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'

function generateToken(pin: string, secret: string): string {
    return createHmac('sha256', secret).update(pin).digest('hex')
}

export function proxy(req: NextRequest) {
    const cookie = req.cookies.get('family_session')
    const isValid = cookie?.value === process.env.FAMILY_PASSPHRASE

    const isLoginPage = req.nextUrl.pathname === '/login'
    const isApiLogin = req.nextUrl.pathname === '/api/auth/login'

    // Let login page and login API through freely
    if (isLoginPage || isApiLogin) {
        return NextResponse.next()
    }

    // Admin route protection
    if (req.nextUrl.pathname.startsWith('/admin/dashboard')) {
        const adminCookie = req.cookies.get('admin_session')
        const expectedToken = generateToken(
            process.env.ADMIN_PIN!,
            process.env.FAMILY_PASSPHRASE!
        )
        if (!adminCookie || adminCookie.value !== expectedToken) {
            return NextResponse.redirect(new URL('/admin', req.url))
        }
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