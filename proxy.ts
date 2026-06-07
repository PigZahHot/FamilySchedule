import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'

function generateToken(value: string, secret: string): string {
    return createHmac('sha256', secret).update(value).digest('hex')
}

export function proxy(req: NextRequest) {
    const origin = req.headers.get('origin')
    const host = req.headers.get('host')
    if (req.method === 'POST' && origin && host && !origin.includes(host)) {
        return new NextResponse('Potential CSRF detected', { status: 403 })
    }

    const cookie = req.cookies.get('family_session')
    const expectedFamilyToken = generateToken(
        process.env.FAMILY_PASSPHRASE!,
        process.env.FAMILY_PASSPHRASE!
    )
    const isValid = cookie?.value === expectedFamilyToken
    const isLoginPage = req.nextUrl.pathname === '/login'
    const isApiLogin = req.nextUrl.pathname === '/api/auth/login'
    const isAdminLogin = req.nextUrl.pathname === '/admin'
    const isApiAdminLogin = req.nextUrl.pathname === '/api/auth/admin'
    const isAcceptBridge = req.nextUrl.pathname === '/api/auth/accept-bridge'

    // Let login page and login API through freely
    if (isLoginPage || isApiLogin || isAdminLogin || isApiAdminLogin || isAcceptBridge) {
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