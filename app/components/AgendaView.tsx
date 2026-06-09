import { format, startOfDay, differenceInDays } from 'date-fns'
import { Appointment, FamilyMember, ShiftDay } from '@/app/types/calendar'

interface Props {
    appointments: Appointment[]
    shiftDays: ShiftDay[]
    members: FamilyMember[]
    onApptClick: (appt: Appointment) => void
    onAddClick: (day: Date) => void
}

function getMemberColor(name: string, members: FamilyMember[]): string {
    return members.find((m) => m.name === name)?.theme_color ?? '#94a3b8'
}

type Group = 'today' | 'tomorrow' | 'this_week' | 'this_month' | 'later'

const GROUP_LABELS: Record<Group, string> = {
    today: 'Today',
    tomorrow: 'Tomorrow',
    this_week: 'This Week',
    this_month: 'This Month',
    later: '30+ Days',
}

const GROUP_ORDER: Group[] = ['today', 'tomorrow', 'this_week', 'this_month', 'later']

function getGroup(dateStr: string): Group {
    const today = startOfDay(new Date())
    const d = startOfDay(new Date(dateStr + 'T00:00:00'))
    const diff = differenceInDays(d, today)
    if (diff === 0) return 'today'
    if (diff === 1) return 'tomorrow'
    if (diff <= 7) return 'this_week'
    if (diff <= 30) return 'this_month'
    return 'later'
}

type AgendaItem =
    | { kind: 'appt'; appt: Appointment; dateStr: string }
    | { kind: 'special'; dateStr: string; label: string }

export default function AgendaView({ appointments, shiftDays, members, onApptClick, onAddClick }: Props) {
    const today = startOfDay(new Date())

    // Build a flat list of all upcoming items
    const items: AgendaItem[] = []

    // Appointments
    appointments.forEach((appt) => {
        const dateStr = appt.event_date.slice(0, 10)
        const d = startOfDay(new Date(dateStr + 'T00:00:00'))
        if (differenceInDays(d, today) >= 0) {
            items.push({ kind: 'appt', appt, dateStr })
        }
    })

    // Holidays & yearly events (next 60 days)
    shiftDays.forEach((s) => {
        if (!s.holiday) return
        const d = startOfDay(new Date(s.date + 'T00:00:00'))
        const diff = differenceInDays(d, today)
        if (diff >= 0 && diff <= 60) {
            items.push({ kind: 'special', dateStr: s.date, label: s.holiday })
        }
    })

    // Sort all items by date ascending
    items.sort((a, b) => a.dateStr.localeCompare(b.dateStr))

    // Group
    const grouped: Record<Group, AgendaItem[]> = {
        today: [], tomorrow: [], this_week: [], this_month: [], later: []
    }
    items.forEach((item) => {
        grouped[getGroup(item.dateStr)].push(item)
    })

    const hasAnything = items.length > 0

    if (!hasAnything) {
        return (
            <div className="fs-card rounded-2xl p-8 text-center">
                <p className="text-2xl mb-2">📅</p>
                <p className="text-sm font-medium" style={{ color: 'var(--fs-text)' }}>No upcoming appointments</p>
                <p className="text-xs mt-1" style={{ color: 'var(--fs-text-muted)' }}>Tap a day on the calendar to add one</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {GROUP_ORDER.map((group) => {
                const groupItems = grouped[group]
                if (groupItems.length === 0) return null

                return (
                    <div key={group}>
                        <p className="fs-section-label mb-2">{GROUP_LABELS[group]}</p>
                        <div className="space-y-2">
                            {groupItems.map((item, idx) => {
                                const d = new Date(item.dateStr + 'T00:00:00')

                                if (item.kind === 'special') {
                                    return (
                                        <div key={`special-${item.dateStr}`}
                                            className="fs-card rounded-xl px-4 py-3 flex items-center gap-3">
                                            <div className="text-center flex-shrink-0" style={{ minWidth: '36px' }}>
                                                <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--fs-holiday)', textTransform: 'uppercase' }}>
                                                    {format(d, 'MMM')}
                                                </p>
                                                <p style={{ fontSize: '18px', fontWeight: 700, lineHeight: 1, color: 'var(--fs-text)' }}>
                                                    {format(d, 'd')}
                                                </p>
                                            </div>
                                            <div style={{ width: '1px', background: 'var(--fs-border)', alignSelf: 'stretch' }} />
                                            <div>
                                                <p className="text-sm font-medium" style={{ color: 'var(--fs-text)' }}>🎉 {item.label}</p>
                                                <p className="text-xs" style={{ color: 'var(--fs-text-muted)' }}>{format(d, 'EEEE')}</p>
                                            </div>
                                        </div>
                                    )
                                }

                                const color = getMemberColor(item.appt.assigned_to, members)
                                return (
                                    <button key={`appt-${item.appt.id}`}
                                        onClick={() => onApptClick(item.appt)}
                                        className="w-full fs-card rounded-xl px-4 py-3 flex items-center gap-3 hover:opacity-80 transition text-left">
                                        <div className="text-center flex-shrink-0" style={{ minWidth: '36px' }}>
                                            <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--fs-text-muted)', textTransform: 'uppercase' }}>
                                                {format(d, 'MMM')}
                                            </p>
                                            <p style={{ fontSize: '18px', fontWeight: 700, lineHeight: 1, color: 'var(--fs-text)' }}>
                                                {format(d, 'd')}
                                            </p>
                                        </div>
                                        <div style={{ width: '1px', background: 'var(--fs-border)', alignSelf: 'stretch' }} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate" style={{ color: 'var(--fs-text)' }}>{item.appt.title}</p>
                                            <p className="text-xs mt-0.5" style={{ color: 'var(--fs-text-muted)' }}>{format(d, 'EEEE')}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                                            <span className="text-xs font-medium" style={{ color: 'var(--fs-text-muted)' }}>{item.appt.assigned_to}</span>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )
            })}

            <button onClick={() => onAddClick(new Date())}
                className="w-full py-3 rounded-xl text-sm font-medium transition hover:opacity-90"
                style={{ background: 'var(--fs-honey)', color: '#fff' }}>
                + Add Appointment
            </button>
        </div>
    )
}