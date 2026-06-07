import { NextRequest, NextResponse } from 'next/server'
import { createHash, createHmac } from 'crypto'
import pool from '@/lib/db'

function generateFamilyToken(passphrase: string): string {
    return createHmac('sha256', passphrase).update(passphrase).digest('hex')
}

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl
    const token = searchParams.get('token')

    if (!token) {
        return NextResponse.redirect(new URL('/login', req.url))
    }

    const hashedToken = createHash('sha256').update(token).digest('hex')

    console.log('Token from URL:', token)
    console.log('Hashed:', hashedToken)

    const result = await pool.query(
        `SELECT * FROM device_bridges`,
        []
    )
    console.log('All rows:', result.rows)

    if (result.rows.length === 0) {
        return NextResponse.redirect(new URL('/login?error=expired', req.url))
    }

    // Delete the row immediately — one time use
    await pool.query(`DELETE FROM device_bridges WHERE hashed_token = $1`, [hashedToken])

    // Set family session cookie
    const familyToken = generateFamilyToken(process.env.FAMILY_PASSPHRASE!)
    const res = NextResponse.redirect(new URL('/', req.url))
    res.cookies.set('family_session', familyToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
    })

    return res
}