import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
    const result = await pool.query('SELECT name, theme_color FROM family_members ORDER BY id')
    return NextResponse.json(result.rows)
}