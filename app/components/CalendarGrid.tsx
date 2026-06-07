import { format, isToday, isSameMonth } from 'date-fns'
import { Appointment, FamilyMember, ShiftDay, ShiftResult } from '@/app/types/calendar'

const WEEKDAYS_LONG = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEKDAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

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
  onDateNumberClick: (day: Date) => void
}

function getShift(date: Date, shiftDays: ShiftDay[]): ShiftResult | null {
  const key = format(date, 'yyyy-MM-dd')
  return shiftDays.find((s) => s.date === key)?.shift ?? null
}

function getHoliday(date: Date, shiftDays: ShiftDay[]): string | null {
  const key = format(date, 'yyyy-MM-dd')
  return shiftDays.find((s) => s.date === key)?.holiday ?? null
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
  loading, startPadding, endPadding, onDayClick, onApptClick, onDateNumberClick
}: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-stone-100">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-stone-100">
        {WEEKDAYS_LONG.map((d, i) => (
          <div key={d} className="py-3 text-center text-xs font-semibold text-stone-400 uppercase tracking-widest">
            <span className="hidden sm:inline">{WEEKDAYS_LONG[i]}</span>
            <span className="sm:hidden">{WEEKDAYS_SHORT[i]}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-7">
          {Array.from({ length: 42 }).map((_, i) => (
            <div key={i} className="h-[72px] sm:h-[120px] p-1.5 sm:p-2 border-b border-r border-stone-50">
              <div className="w-5 h-5 rounded-full bg-stone-100 animate-pulse mb-2" />
              <div className="h-2.5 rounded-lg bg-stone-100 animate-pulse mb-1.5 w-3/4" />
              <div className="h-2.5 rounded-lg bg-stone-100 animate-pulse w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7">
          {Array.from({ length: startPadding }).map((_, i) => (
            <div key={`pad-${i}`} className="h-[72px] sm:h-[120px] border-b border-r border-stone-50 bg-stone-50/30" />
          ))}

          {days.map((day) => {
            const shift = getShift(day, shiftDays)
            const appts = getDayAppointments(day, appointments)
            const holiday = getHoliday(day, shiftDays)
            const today = isToday(day)
            const inMonth = isSameMonth(day, activeDate)

            return (
              <div
                key={day.toISOString()}
                onClick={() => onDayClick(day)}
                className={`h-[72px] sm:h-[120px] p-1.5 sm:p-2 border-b border-r border-stone-50 cursor-pointer transition-colors hover:bg-stone-50/70 ${!inMonth ? 'opacity-30' : ''
                  } ${today ? 'bg-amber-50/30' : ''}`}
              >
                {/* Top row: date + shift icon */}
                <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDateNumberClick(day)
                    }}
                    className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full text-xs font-semibold transition hover:bg-stone-200 ${today ? 'bg-stone-800 text-white' : 'text-stone-500'
                      }`}
                  >
                    {format(day, 'd')}
                  </button>
                  {shift && shift.type !== 'Off' && (
                    <span className="text-[10px] sm:text-xs leading-none opacity-80">
                      {shiftStyle(shift.type).icon}
                    </span>
                  )}
                </div>

                {/* Holiday label — desktop only */}
                {holiday && (
                  <div className="hidden sm:block text-[9px] text-red-400 font-semibold truncate leading-tight mb-0.5">
                    🇵🇭 {holiday}
                  </div>
                )}

                {/* Desktop: appointment badges */}
                <div className="hidden sm:block">
                  {appts.slice(0, 2).map((a) => (
                    <div
                      key={a.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onApptClick(a)
                      }}
                      className="text-xs rounded-lg px-1.5 py-0.5 mb-0.5 text-white truncate cursor-pointer hover:opacity-80 transition font-medium member-color"
                      style={{ '--member-color': getMemberColor(a.assigned_to, members) } as React.CSSProperties}
                    >
                      {a.title}
                    </div>
                  ))}
                  {appts.length > 2 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDateNumberClick(day)
                      }}
                      className="text-xs text-stone-400 px-1 mt-0.5 font-medium hover:text-stone-600 transition"
                    >
                      +{appts.length - 2} more
                    </button>
                  )}
                </div>

                {/* Mobile: dot indicators */}
                {(appts.length > 0 || holiday) && (
                  <div className="flex sm:hidden gap-0.5 flex-wrap mt-1">
                    {holiday && (
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-red-400" />
                    )}
                    {appts.slice(0, 3).map((a) => (
                      <span
                        key={a.id}
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getMemberColor(a.assigned_to, members) }}
                      />
                    ))}
                    {appts.length > 3 && (
                      <span className="text-[9px] text-stone-400 leading-none mt-0.5">+{appts.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {Array.from({ length: endPadding }).map((_, i) => (
            <div key={`end-pad-${i}`} className="h-[72px] sm:h-[120px] border-b border-r border-stone-50 bg-stone-50/30" />
          ))}
        </div>
      )}
    </div>
  )
}