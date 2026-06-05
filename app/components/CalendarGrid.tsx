import { format, isToday, isSameMonth } from 'date-fns'
import { Appointment, FamilyMember, ShiftDay, ShiftResult } from '@/app/types/calendar'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface Props {
  days: Date[]
  activeDate: Date
  shiftDays: ShiftDay[]
  appointments: Appointment[]
  members: FamilyMember[]
  loading: boolean
  startPadding: number
  endPadding: number
  onDayClick: (day: Date) => void
  onApptClick: (appt: Appointment) => void
}

function getShift(date: Date, shiftDays: ShiftDay[]): ShiftResult | null {
  const key = format(date, 'yyyy-MM-dd')
  return shiftDays.find((s) => s.date === key)?.shift ?? null
}

function getDayAppointments(date: Date, appointments: Appointment[]): Appointment[] {
  const key = format(date, 'yyyy-MM-dd')
  return appointments.filter((a) => a.event_date.slice(0, 10) === key)
}

function getMemberColor(name: string, members: FamilyMember[]): string {
  return members.find((m) => m.name === name)?.theme_color ?? '#94a3b8'
}

function shiftStyle(type: string) {
  if (type === 'Day') return { icon: '☀️' }
  if (type === 'Night') return { icon: '🌙' }
  return { icon: '' }
}

export default function CalendarGrid({
  days, activeDate, shiftDays, appointments, members,
  loading, startPadding, endPadding, onDayClick, onApptClick
}: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-stone-100">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-stone-100">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-3 text-center text-xs font-semibold text-stone-400 uppercase tracking-widest">
            {d}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center text-stone-300 text-sm">
          Loading...
        </div>
      ) : (
        <div className="grid grid-cols-7">
          {Array.from({ length: startPadding }).map((_, i) => (
            <div key={`pad-${i}`} className="h-[120px] border-b border-r border-stone-50 bg-stone-50/30" />
          ))}

          {days.map((day) => {
            const shift = getShift(day, shiftDays)
            const appts = getDayAppointments(day, appointments)
            const today = isToday(day)
            const inMonth = isSameMonth(day, activeDate)

            return (
              <div
                key={day.toISOString()}
                onClick={() => onDayClick(day)}
                className={`h-[120px] p-2 border-b border-r border-stone-50 cursor-pointer transition-colors hover:bg-stone-50/70 ${
                  !inMonth ? 'opacity-30' : ''
                } ${today ? 'bg-amber-50/30' : ''}`}
              >
                {/* Top row: date + shift icon */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold ${
                    today
                      ? 'bg-stone-800 text-white'
                      : 'text-stone-500'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  {shift && shift.type !== 'Off' && (
                    <span className="text-xs leading-none opacity-80">
                      {shiftStyle(shift.type).icon}
                    </span>
                  )}
                </div>

                {/* Appointments */}
                {appts.slice(0, 2).map((a) => (
                  <div
                    key={a.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onApptClick(a)
                    }}
                    className="text-xs rounded-lg px-1.5 py-0.5 mb-0.5 text-white truncate cursor-pointer hover:opacity-80 transition font-medium"
                    style={{ backgroundColor: getMemberColor(a.assigned_to, members) }}
                  >
                    {a.title}
                  </div>
                ))}
                {appts.length > 2 && (
                  <div className="text-xs text-stone-400 px-1 mt-0.5 font-medium">
                    +{appts.length - 2} more
                  </div>
                )}
              </div>
            )
          })}

          {Array.from({ length: endPadding }).map((_, i) => (
            <div key={`end-pad-${i}`} className="h-[120px] border-b border-r border-stone-50 bg-stone-50/30" />
          ))}
        </div>
      )}
    </div>
  )
}