import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
    const result = await db.query('SELECT * FROM yearly_events ORDER BY month, day')
    return NextResponse.json(result.rows)
}

export async function POST(req: NextRequest) {
    const { title, month, day } = await req.json()

    if (typeof month !== 'number' || month < 1 || month > 12) {
        return NextResponse.json({ error: 'Invalid month' }, { status: 400 })
    }
    
    let maxDays = 31
    if (month === 2) maxDays = 29
    else if ([4, 6, 9, 11].includes(month)) maxDays = 30
    
    if (typeof day !== 'number' || day < 1 || day > maxDays) {
        return NextResponse.json({ error: 'Invalid day for given month' }, { status: 400 })
    }

    await db.query(
        'INSERT INTO yearly_events (title, month, day) VALUES ($1, $2, $3)',
        [title, month, day]
    )
    return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
    const { id } = await req.json()
    await db.query('DELETE FROM yearly_events WHERE id = $1', [id])
    return NextResponse.json({ ok: true })
}