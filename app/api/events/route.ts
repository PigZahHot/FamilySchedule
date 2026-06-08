import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { calculateShift } from '@/lib/shift'
import { addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getYear } from 'date-fns'

function parseAnchorDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day)
}

async function fetchPhHolidays(years: number[]): Promise<Map<string, string>> {
    const holidayMap = new Map<string, string>()
    await Promise.all(
        years.map(async (year) => {
            try {
                const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/PH`)
                if (!res.ok) return
                const data: { date: string; localName: string }[] = await res.json()
                data.forEach((h) => holidayMap.set(h.date, h.localName))
            } catch {
                // silently fail if holiday API is down
            }
        })
    )
    return holidayMap
}

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl
    const monthParam = searchParams.get('month')

    if (!monthParam) {
        return NextResponse.json({ error: 'Missing month parameter' }, { status: 400 })
    }

    const centerDate = new Date(`${monthParam}-01`)
    const rangeStart = startOfMonth(subMonths(centerDate, 5))
    const rangeEnd = endOfMonth(addMonths(centerDate, 5))

    // Get all years in range (could span 2 years)
    const years = Array.from(
        new Set([getYear(rangeStart), getYear(rangeEnd)])
    )

    const [appointmentsResult, shiftConfigResult, exceptionsResult, holidayMap, yearlyEventsResult] = await Promise.all([
        pool.query(
            `SELECT * FROM appointments WHERE event_date BETWEEN $1 AND $2`,
            [rangeStart, rangeEnd]
        ),
        pool.query(`SELECT * FROM shift_configs WHERE id = 1`),
        pool.query(
            `SELECT * FROM shift_exceptions WHERE override_date BETWEEN $1 AND $2`,
            [rangeStart, rangeEnd]
        ),
        fetchPhHolidays(years),
        pool.query(`SELECT * FROM yearly_events`),
    ])

    const shiftConfig = shiftConfigResult.rows[0]
    const appointments = appointmentsResult.rows
    const exceptions = exceptionsResult.rows
    const yearlyEvents = yearlyEventsResult.rows
    const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd })
    const shiftDays = days.map((date) => {
        const dateStr = date.toISOString().split('T')[0]
        const [y, m, d] = dateStr.split('-').map(Number)
        const localDate = new Date(y, m - 1, d)

        const exception = exceptions.find((e) => e.override_date === dateStr)
        if (exception) {
            return {
                date: dateStr,
                shift: { type: exception.override_type, label: exception.custom_title || exception.override_type },
                holiday: holidayMap.get(dateStr) ?? null,
            }
        }

        const shift = shiftConfig
            ? calculateShift(localDate, parseAnchorDate(shiftConfig.anchor_date), shiftConfig.anchor_shift_type)
            : null

        const yearlyEvent = yearlyEvents.find((e) => {
            let targetDay = e.day;
            // If it's a Feb 29 event, and the current year is not a leap year, show it on Feb 28
            if (e.month === 2 && e.day === 29) {
                const isLeapYear = (localDate.getFullYear() % 4 === 0 && localDate.getFullYear() % 100 !== 0) || (localDate.getFullYear() % 400 === 0);
                if (!isLeapYear) targetDay = 28;
            }
            return e.month === localDate.getMonth() + 1 && targetDay === localDate.getDate();
        })

        return {
            date: dateStr,
            shift,
            holiday: holidayMap.get(dateStr) ?? null,
            yearlyEvent: yearlyEvent ? { title: yearlyEvent.title, label: yearlyEvent.label } : null,
        }
    })

    return NextResponse.json({ appointments, shiftDays })
}