import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(req: NextRequest) {
  const { title, event_date, assigned_to } = await req.json()

  if (!title || !event_date || !assigned_to) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const result = await pool.query(
    `INSERT INTO appointments (title, event_date, assigned_to) VALUES ($1, $2::date, $3) RETURNING *`,
    [title, event_date, assigned_to]
  )

  return NextResponse.json(result.rows[0])
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  await pool.query(`DELETE FROM appointments WHERE id = $1`, [id])
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: Request) {
  const { id, title, assigned_to, event_date } = await req.json()
  await pool.query(
    'UPDATE appointments SET title = $1, assigned_to = $2, event_date = $3 WHERE id = $4',
    [title, assigned_to, event_date, id]
  )
  return Response.json({ ok: true })
}