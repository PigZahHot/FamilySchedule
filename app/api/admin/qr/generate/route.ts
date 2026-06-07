import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createHash } from 'crypto'
import pool from '@/lib/db'

export async function POST() {
    // Clean up expired tokens first
    await pool.query(`DELETE FROM device_bridges WHERE expires_at < NOW()`)

    const token = randomUUID()
    const hashedToken = createHash('sha256').update(token).digest('hex')
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000) // 2 minutes

    await pool.query(
        `INSERT INTO device_bridges (hashed_token, expires_at) VALUES ($1, $2)`,
        [hashedToken, expiresAt]
    )

    return NextResponse.json({ token, expiresAt: expiresAt.toISOString() })
}