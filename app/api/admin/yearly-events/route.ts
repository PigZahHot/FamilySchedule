import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
    const result = await db.query('SELECT * FROM yearly_events ORDER BY month, day')
    return NextResponse.json(result.rows)
}

const VALID_LABELS = ['Holiday', 'Birthday', 'Anniversary', 'Event']

export async function POST(req: NextRequest) {
    const { title, month, day, label } = await req.json()

    if (typeof month !== 'number' || month < 1 || month > 12) {
        return NextResponse.json({ error: 'Invalid month' }, { status: 400 })
    }
    
    let maxDays = 31
    if (month === 2) maxDays = 29
    else if ([4, 6, 9, 11].includes(month)) maxDays = 30
    
    if (typeof day !== 'number' || day < 1 || day > maxDays) {
        return NextResponse.json({ error: 'Invalid day for given month' }, { status: 400 })
    }

    const safeLabel = VALID_LABELS.includes(label) ? label : 'Event'

    await db.query(
        'INSERT INTO yearly_events (title, month, day, label) VALUES ($1, $2, $3, $4)',
        [title, month, day, safeLabel]
    )
    return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
    const { id } = await req.json()
    await db.query('DELETE FROM yearly_events WHERE id = $1', [id])
    return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest) {
    const { id, title, month, day, label } = await req.json()

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    if (typeof month !== 'number' || month < 1 || month > 12) {
        return NextResponse.json({ error: 'Invalid month' }, { status: 400 })
    }

    let maxDays = 31
    if (month === 2) maxDays = 29
    else if ([4, 6, 9, 11].includes(month)) maxDays = 30

    if (typeof day !== 'number' || day < 1 || day > maxDays) {
        return NextResponse.json({ error: 'Invalid day for given month' }, { status: 400 })
    }

    const safeLabel = VALID_LABELS.includes(label) ? label : 'Event'

    await db.query(
        'UPDATE yearly_events SET title = $1, month = $2, day = $3, label = $4 WHERE id = $5',
        [title, month, day, safeLabel, id]
    )
    return NextResponse.json({ ok: true })
}