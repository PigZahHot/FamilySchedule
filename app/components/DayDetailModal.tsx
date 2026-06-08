import { format } from 'date-fns'
import { Appointment, FamilyMember, ShiftDay } from '@/app/types/calendar'

interface Props {
    day: Date; appointments: Appointment[]; members: FamilyMember[]
    shiftDays: ShiftDay[]; onClose: () => void
    onAddClick: () => void; onApptClick: (appt: Appointment) => void
}

function getMemberColor(name: string, members: FamilyMember[]): string {
    return members.find((m) => m.name === name)?.theme_color ?? '#94a3b8'
}

export default function DayDetailModal({ day, appointments, members, shiftDays, onClose, onAddClick, onApptClick }: Props) {
    const holiday = shiftDays.find((s) => s.date === format(day, 'yyyy-MM-dd'))?.holiday

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
            <div className="fs-card rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h2 className="text-base font-semibold" style={{ color: 'var(--fs-text)' }}>
                            {format(day, 'MMMM d, yyyy')}
                        </h2>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--fs-text-muted)' }}>{format(day, 'EEEE')}</p>
                    </div>
                    <button onClick={onClose} className="text-xl leading-none transition hover:opacity-60"
                        style={{ color: 'var(--fs-text-muted)' }}>×</button>
                </div>

                {/* Holiday banner */}
                {holiday && (
                    <div className="flex items-center gap-2 rounded-xl px-3 py-2 mb-3"
                        style={{ background: '#fef2f2', border: '0.5px solid #fecaca' }}>
                        <span className="text-sm">🇵🇭</span>
                        <span className="text-xs font-medium" style={{ color: 'var(--fs-holiday)' }}>{holiday}</span>
                    </div>
                )}

                {/* Appointment list */}
                <div className="space-y-1 mb-4 max-h-64 overflow-y-auto">
                    {appointments.length === 0 ? (
                        <p className="text-sm text-center py-6" style={{ color: 'var(--fs-text-faint)' }}>No appointments</p>
                    ) : (
                        appointments.map((appt) => (
                            <button key={appt.id} onClick={() => onApptClick(appt)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-left hover:bg-[var(--fs-bg)]">
                                <span className="fs-dot flex-shrink-0" style={{ backgroundColor: getMemberColor(appt.assigned_to, members) }} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate" style={{ color: 'var(--fs-text)' }}>{appt.title}</p>
                                    <p className="text-xs" style={{ color: 'var(--fs-text-muted)' }}>{appt.assigned_to}</p>
                                </div>
                                <span style={{ color: 'var(--fs-text-faint)' }}>›</span>
                            </button>
                        ))
                    )}
                </div>

                {/* Add button */}
                <button onClick={onAddClick}
                    className="w-full py-2.5 rounded-xl text-sm font-medium transition hover:opacity-90"
                    style={{ background: 'var(--fs-honey)', color: '#fff' }}>
                    + Add Appointment
                </button>
            </div>
        </div>
    )
}