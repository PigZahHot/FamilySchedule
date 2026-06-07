import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'

function generateToken(pin: string, secret: string): string {
    return createHmac('sha256', secret).update(pin).digest('hex')
}

export async function GET(req: NextRequest) {
    const adminCookie = req.cookies.get('admin_session')
    const expectedToken = generateToken(
        process.env.ADMIN_PIN!,
        process.env.FAMILY_PASSPHRASE!
    )
    if (!adminCookie || adminCookie.value !== expectedToken) {
        return NextResponse.json({ ok: false }, { status: 401 })
    }
    return NextResponse.json({ ok: true })
}