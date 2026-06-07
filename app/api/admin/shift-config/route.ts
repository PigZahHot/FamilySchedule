import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
    const result = await pool.query('SELECT * FROM shift_configs WHERE id = 1')
    return NextResponse.json(result.rows[0] ?? null)
}

export async function PATCH(req: NextRequest) {
    const { anchor_date, anchor_shift_type } = await req.json()
    if (!anchor_date || !anchor_shift_type) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    const result = await pool.query(
        'UPDATE shift_configs SET anchor_date = $1, anchor_shift_type = $2 WHERE id = 1 RETURNING *',
        [anchor_date, anchor_shift_type]
    )
    return NextResponse.json(result.rows[0])
}