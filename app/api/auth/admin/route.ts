import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'

const attempts = new Map<string, { count: number; resetAt: number }>()

function generateToken(pin: string): string {
    const secret = process.env.FAMILY_PASSPHRASE!
    return createHmac('sha256', secret).update(pin).digest('hex')
}

function safeCompare(a: string, b: string): boolean {
    const bufA = Buffer.from(a)
    const bufB = Buffer.from(b)
    if (bufA.length !== bufB.length) return false
    return timingSafeEqual(bufA, bufB)
}

export async function POST(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const now = Date.now()

    const record = attempts.get(ip)
    if (record) {
        if (now < record.resetAt) {
            if (record.count >= 5) {
                return NextResponse.json({ message: 'Too many attempts.' }, { status: 429 })
            }
            record.count++
        } else {
            attempts.set(ip, { count: 1, resetAt: now + 60_000 })
        }
    } else {
        attempts.set(ip, { count: 1, resetAt: now + 60_000 })
    }

    const { pin } = await req.json()

    if (!pin || !safeCompare(pin, process.env.ADMIN_PIN!)) {
        return NextResponse.json({ message: 'Incorrect PIN.' }, { status: 401 })
    }

    const token = generateToken(pin)

    const res = NextResponse.json({ ok: true })
    res.cookies.set('admin_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60,
        path: '/',
    })

    return res
}