import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { calculateShift } from '@/lib/shift'
import { addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl
    const monthParam = searchParams.get('month')

    if (!monthParam) {
        return NextResponse.json({ error: 'Missing month parameter' }, { status: 400 })
    }

    const centerDate = new Date(`${monthParam}-01`)
    const rangeStart = startOfMonth(subMonths(centerDate, 2))
    const rangeEnd = endOfMonth(addMonths(centerDate, 2))

    // Fetch appointments, shift config, and exceptions in parallel
    const [appointmentsResult, shiftConfigResult, exceptionsResult] = await Promise.all([
        pool.query(
            `SELECT * FROM appointments WHERE event_date BETWEEN $1 AND $2`,
            [rangeStart, rangeEnd]
        ),
        pool.query(`SELECT * FROM shift_configs WHERE id = 1`),
        pool.query(
            `SELECT * FROM shift_exceptions WHERE override_date BETWEEN $1 AND $2`,
            [rangeStart, rangeEnd]
        ),
    ])

    const shiftConfig = shiftConfigResult.rows[0]
    const appointments = appointmentsResult.rows
    const exceptions = exceptionsResult.rows

    // Build shift calendar
    const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd })
    const shiftDays = days.map((date) => {
        const dateStr = date.toISOString().split('T')[0]

        // Check for exception override first
        const exception = exceptions.find((e) => e.override_date === dateStr)
        if (exception) {
            return {
                date: dateStr,
                shift: { type: exception.override_type, label: exception.custom_title || exception.override_type },
            }
        }

        // Otherwise calculate from shift engine
        const shift = shiftConfig
            ? calculateShift(date, new Date(shiftConfig.anchor_date), shiftConfig.anchor_shift_type)
            : null

        return { date: dateStr, shift }
    })

    return NextResponse.json({
        appointments,
        shiftDays,
    })
}