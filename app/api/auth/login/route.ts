import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'

const RATE_LIMIT = new Map<string, { count: number; resetAt: number }>()

function generateToken(value: string): string {
    const secret = process.env.FAMILY_PASSPHRASE!
    return createHmac('sha256', secret).update(value).digest('hex')
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

    const record = RATE_LIMIT.get(ip)
    if (record) {
        if (now < record.resetAt && record.count >= 5) {
            return NextResponse.json(
                { message: 'Too many attempts. Try again in a minute.' },
                { status: 429 }
            )
        }
        if (now >= record.resetAt) {
            RATE_LIMIT.set(ip, { count: 1, resetAt: now + 60_000 })
        } else {
            record.count++
        }
    } else {
        RATE_LIMIT.set(ip, { count: 1, resetAt: now + 60_000 })
    }

    const { passphrase } = await req.json()

    if (!passphrase || !safeCompare(passphrase, process.env.FAMILY_PASSPHRASE!)) {
        return NextResponse.json({ message: 'Incorrect passphrase.' }, { status: 401 })
    }

    const token = generateToken(passphrase)

    const response = NextResponse.json({ ok: true })
    response.cookies.set('family_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
    })

    return response
}