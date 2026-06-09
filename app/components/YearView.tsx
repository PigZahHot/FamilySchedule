import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, getYear } from 'date-fns'
import { Appointment, FamilyMember, ShiftDay } from '@/app/types/calendar'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

interface Props {
    activeDate: Date
    allShiftDays: ShiftDay[]
    allAppointments: Appointment[]
    members: FamilyMember[]
    onMonthClick: (date: Date) => void
    onDayClick: (day: Date) => void
}

function getMemberColor(name: string, members: FamilyMember[]): string {
    return members.find((m) => m.name === name)?.theme_color ?? '#94a3b8'
}

function MiniMonth({ year, monthIndex, allShiftDays, allAppointments, members, onMonthClick, onDayClick }: {
    year: number; monthIndex: number
    allShiftDays: ShiftDay[]; allAppointments: Appointment[]
    members: FamilyMember[]
    onMonthClick: (date: Date) => void
    onDayClick: (day: Date) => void
}) {
    const monthDate = new Date(year, monthIndex, 1)
    const days = eachDayOfInterval({ start: startOfMonth(monthDate), end: endOfMonth(monthDate) })
    const startPad = getDay(startOfMonth(monthDate))
    const totalCells = Math.ceil((days.length + startPad) / 7) * 7

    return (
        <div className="fs-card rounded-xl p-3 cursor-pointer hover:shadow-fs transition"
            onClick={() => onMonthClick(monthDate)}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--fs-text)' }}>
                {MONTHS[monthIndex]}
            </p>
            <div className="grid grid-cols-7 mb-1">
                {DAYS.map((d, i) => (
                    <div key={i} className="text-center" style={{ fontSize: '8px', color: 'var(--fs-text-faint)', fontWeight: 500 }}>{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-y-0.5">
                {Array.from({ length: totalCells }).map((_, i) => {
                    const dayIndex = i - startPad
                    if (dayIndex < 0 || dayIndex >= days.length) {
                        return <div key={i} />
                    }
                    const day = days[dayIndex]
                    const dateStr = format(day, 'yyyy-MM-dd')
                    const shiftDay = allShiftDays.find((s) => s.date === dateStr)
                    const appts = allAppointments.filter((a) => a.event_date.slice(0, 10) === dateStr)
                    const today = isToday(day)
                    const isDay = shiftDay?.shift?.type === 'Day'
                    const isNight = shiftDay?.shift?.type === 'Night'
                    const hasHoliday = !!shiftDay?.holiday

                    return (
                        <div key={i}
                            onClick={(e) => { e.stopPropagation(); onDayClick(day) }}
                            className="flex flex-col items-center"
                            style={{ cursor: 'pointer' }}
                        >
                            <div
                                className="flex items-center justify-center rounded-full transition hover:opacity-80"
                                style={{
                                    width: '16px', height: '16px', fontSize: '8px', fontWeight: today ? 600 : 400,
                                    background: today ? 'var(--fs-honey)' : 'transparent',
                                    color: today ? '#fff' : 'var(--fs-text)',
                                }}
                            >
                                {format(day, 'd')}
                            </div>
                            {/* Dot row */}
                            <div className="flex gap-px justify-center" style={{ minHeight: '4px' }}>
                                {isDay && <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--fs-day)' }} />}
                                {isNight && <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--fs-night)' }} />}
                                {hasHoliday && <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--fs-holiday)' }} />}
                                {appts.slice(0, 1).map((a) => (
                                    <div key={a.id} style={{ width: '3px', height: '3px', borderRadius: '50%', background: getMemberColor(a.assigned_to, members) }} />
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default function YearView({ activeDate, allShiftDays, allAppointments, members, onMonthClick, onDayClick }: Props) {
    const year = getYear(activeDate)

    return (
        <div>
            <p className="text-sm font-semibold mb-4" style={{ color: 'var(--fs-text)' }}>{year}</p>
            {/* Desktop: 4x3, Mobile: 2x6 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                    <MiniMonth key={i} year={year} monthIndex={i}
                        allShiftDays={allShiftDays} allAppointments={allAppointments}
                        members={members} onMonthClick={onMonthClick} onDayClick={onDayClick}
                    />
                ))}
            </div>
        </div>
    )
}