import { NextRequest, NextResponse } from 'next/server'

async function generateToken(pin: string, secret: string): Promise<string> {
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    )
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(pin))
    
    return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
}

export async function middleware(req: NextRequest) {
    if (!req.nextUrl.pathname.startsWith('/api/admin/')) {
        return NextResponse.next()
    }

    const adminCookie = req.cookies.get('admin_session')
    
    if (!process.env.ADMIN_PIN || !process.env.FAMILY_PASSPHRASE) {
        return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    const expectedToken = await generateToken(
        process.env.ADMIN_PIN,
        process.env.FAMILY_PASSPHRASE
    )

    if (!adminCookie || adminCookie.value !== expectedToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/api/admin/:path*'],
}
