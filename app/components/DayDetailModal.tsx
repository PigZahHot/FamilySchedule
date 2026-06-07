import { format } from 'date-fns'
import { Appointment, FamilyMember } from '@/app/types/calendar'
import { ShiftDay } from '@/app/types/calendar'

interface Props {
    day: Date
    appointments: Appointment[]
    members: FamilyMember[]
    shiftDays: ShiftDay[]
    onClose: () => void
    onAddClick: () => void
    onApptClick: (appt: Appointment) => void
}

function getMemberColor(name: string, members: FamilyMember[]): string {
    return members.find((m) => m.name === name)?.theme_color ?? '#94a3b8'
}

export default function DayDetailModal({
    day, appointments, members, shiftDays, onClose, onAddClick, onApptClick
}: Props) {
    const formatted = day.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })

    return (
        <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 border border-stone-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h2 className="text-base font-semibold text-stone-800">
                            {format(day, 'MMMM d, yyyy')}
                        </h2>
                        <p className="text-stone-400 text-xs mt-0.5">{format(day, 'EEEE')}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-stone-300 hover:text-stone-500 transition text-xl leading-none mt-0.5"
                    >
                        ×
                    </button>
                </div>

                {/* Holiday banner */}
                {(() => {
                    const key = format(day, 'yyyy-MM-dd')
                    const holiday = shiftDays.find((s) => s.date === key)?.holiday
                    return holiday ? (
                        <div className="flex items-center gap-2 bg-red-50 rounded-xl px-3 py-2 mb-3">
                            <span className="text-sm">🇵🇭</span>
                            <span className="text-xs font-medium text-red-500">{holiday}</span>
                        </div>
                    ) : null
                })()}

                {/* Appointment list */}
                <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                    {appointments.length === 0 ? (
                        <p className="text-stone-300 text-sm text-center py-6">No appointments</p>
                    ) : (
                        appointments.map((appt) => {
                            const color = getMemberColor(appt.assigned_to, members)
                            return (
                                <button
                                    key={appt.id}
                                    onClick={() => onApptClick(appt)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-stone-50 transition text-left"
                                >
                                    <span
                                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: color }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-stone-700 truncate">{appt.title}</p>
                                        <p className="text-xs text-stone-400">{appt.assigned_to}</p>
                                    </div>
                                    <span className="text-stone-300 text-sm">›</span>
                                </button>
                            )
                        })
                    )}
                </div>

                {/* Add button */}
                <button
                    onClick={onAddClick}
                    className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-sm font-medium transition"
                >
                    + Add Appointment
                </button>
            </div>
        </div>
    )
}