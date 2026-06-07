import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
    const result = await pool.query('SELECT * FROM shift_exceptions ORDER BY override_date')
    return NextResponse.json(result.rows)
}

export async function POST(req: NextRequest) {
    const { override_date, override_type, custom_title } = await req.json()
    if (!override_date || !override_type) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    const result = await pool.query(
        `INSERT INTO shift_exceptions (override_date, override_type, custom_title)
     VALUES ($1, $2, $3)
     ON CONFLICT (override_date) DO UPDATE
     SET override_type = $2, custom_title = $3
     RETURNING *`,
        [override_date, override_type, custom_title ?? null]
    )
    return NextResponse.json(result.rows[0])
}

export async function DELETE(req: NextRequest) {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    await pool.query('DELETE FROM shift_exceptions WHERE id = $1', [id])
    return NextResponse.json({ ok: true })
}