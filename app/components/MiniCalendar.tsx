import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday } from 'date-fns'
import { Appointment, FamilyMember, ShiftDay } from '@/app/types/calendar'

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

interface Props {
    date: Date
    shiftDays: ShiftDay[]
    appointments: Appointment[]
    members: FamilyMember[]
    label?: string
    onClick: () => void
}

function getMemberColor(name: string, members: FamilyMember[]): string {
    return members.find((m) => m.name === name)?.theme_color ?? '#94a3b8'
}

export default function MiniCalendar({ date, shiftDays, appointments, members, label, onClick }: Props) {
    const days = eachDayOfInterval({ start: startOfMonth(date), end: endOfMonth(date) })
    const startPad = getDay(startOfMonth(date))
    const totalCells = 42

    return (
        <div
            onClick={onClick}
            className="fs-card rounded-2xl p-4 cursor-pointer hover:shadow-fs transition-all select-none"
            style={{ opacity: 0.85 }}
        >
            {/* Month label */}
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--fs-text)' }}>
                {label ?? format(date, 'MMMM yyyy')}
            </p>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
                {DAYS.map((d, i) => (
                    <div key={i} className="text-center"
                        style={{ fontSize: '8px', color: 'var(--fs-text-faint)', fontWeight: 500 }}>{d}</div>
                ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-y-0.5">
                {Array.from({ length: totalCells }).map((_, i) => {
                    const dayIndex = i - startPad
                    if (dayIndex < 0 || dayIndex >= days.length) return <div key={i} className="h-5" />
                    const day = days[dayIndex]
                    const dateStr = format(day, 'yyyy-MM-dd')
                    const shiftDay = shiftDays.find((s) => s.date === dateStr)
                    const appts = appointments.filter((a) => a.event_date.slice(0, 10) === dateStr)
                    const today = isToday(day)
                    const shiftType = shiftDay?.shift?.type
                    const isDay = shiftType === 'Day'
                    const isNight = shiftType === 'Night'
                    const hasHoliday = !!shiftDay?.holiday

                    return (
                        <div key={i} className="flex flex-col items-center">
                            <div
                                className="flex items-center justify-center rounded-full"
                                style={{
                                    width: '16px', height: '16px', fontSize: '8px',
                                    fontWeight: today ? 600 : 400,
                                    background: today
                                        ? 'var(--fs-honey)'
                                        : isDay
                                            ? 'var(--fs-day-bg)'
                                            : isNight
                                                ? 'var(--fs-night-bg)'
                                                : 'transparent',
                                    color: today
                                        ? '#fff'
                                        : isDay
                                            ? 'var(--fs-day-text)'
                                            : isNight
                                                ? 'var(--fs-night-text)'
                                                : 'var(--fs-text)',
                                }}
                            >
                                {format(day, 'd')}
                            </div>
                            <div className="flex gap-px justify-center" style={{ minHeight: '4px' }}>
                                {hasHoliday && (
                                    <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--fs-holiday)' }} />
                                )}
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