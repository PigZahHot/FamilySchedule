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