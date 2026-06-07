import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
    const result = await pool.query('SELECT id, name, theme_color FROM family_members ORDER BY id')
    return NextResponse.json(result.rows)
}

export async function POST(req: NextRequest) {
    const { name, theme_color } = await req.json()
    if (!name || !theme_color) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    const result = await pool.query(
        'INSERT INTO family_members (name, theme_color) VALUES ($1, $2) RETURNING *',
        [name, theme_color]
    )
    return NextResponse.json(result.rows[0])
}

export async function DELETE(req: NextRequest) {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    await pool.query('DELETE FROM family_members WHERE id = $1', [id])
    return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest) {
    const { id, name, theme_color } = await req.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const result = await pool.query(
        'UPDATE family_members SET name = $1, theme_color = $2 WHERE id = $3 RETURNING *',
        [name, theme_color, id]
    )
    return NextResponse.json(result.rows[0])
}