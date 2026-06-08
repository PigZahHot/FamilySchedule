import { format, isToday, isSameMonth } from 'date-fns'
import { Appointment, FamilyMember, ShiftDay, ShiftResult } from '@/app/types/calendar'

const WEEKDAYS_LONG = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEKDAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

interface Props {
  days: Date[]; activeDate: Date; shiftDays: ShiftDay[]; appointments: Appointment[]
  members: FamilyMember[]; loading: boolean; startPadding: number; endPadding: number
  onDayClick: (day: Date) => void; onApptClick: (appt: Appointment) => void
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
function getYearlyEvent(date: Date, shiftDays: ShiftDay[]): { title: string; label: string } | null {
  const key = format(date, 'yyyy-MM-dd')
  return shiftDays.find((s) => s.date === key)?.yearlyEvent ?? null
}
function getDayAppointments(date: Date, appointments: Appointment[]): Appointment[] {
  const key = format(date, 'yyyy-MM-dd')
  return appointments.filter((a) => a.event_date.slice(0, 10) === key)
}
function getMemberColor(name: string, members: FamilyMember[]): string {
  return members.find((m) => m.name === name)?.theme_color ?? '#94a3b8'
}

export default function CalendarGrid({
  days, activeDate, shiftDays, appointments, members,
  loading, startPadding, endPadding, onDayClick, onApptClick, onDateNumberClick
}: Props) {
  return (
    <div className="fs-card rounded-2xl overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-[var(--fs-border-light)]">
        {WEEKDAYS_LONG.map((d, i) => (
          <div key={d} className="py-3 text-center text-xs font-medium uppercase tracking-widest"
            style={{ color: 'var(--fs-text-muted)' }}>
            <span className="hidden sm:inline">{WEEKDAYS_LONG[i]}</span>
            <span className="sm:hidden">{WEEKDAYS_SHORT[i]}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-7">
          {Array.from({ length: 42 }).map((_, i) => (
            <div key={i} className="h-[60px] sm:h-[110px] p-1 sm:p-2 border-b border-r border-[var(--fs-border-light)]">
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[var(--fs-border)] animate-pulse mb-2" />
              <div className="h-2 rounded-lg bg-[var(--fs-border)] animate-pulse mb-1.5 w-3/4" />
              <div className="h-2 rounded-lg bg-[var(--fs-border)] animate-pulse w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7">
          {Array.from({ length: startPadding }).map((_, i) => (
            <div key={`pad-${i}`} className="h-[60px] sm:h-[110px] border-b border-r border-[var(--fs-border-light)]"
              style={{ background: 'var(--fs-bg)' }} />
          ))}

          {days.map((day) => {
            const shift = getShift(day, shiftDays)
            const appts = getDayAppointments(day, appointments)
            const holiday = getHoliday(day, shiftDays)
            const yearlyEvent = getYearlyEvent(day, shiftDays)
            const today = isToday(day)
            const inMonth = isSameMonth(day, activeDate)

            return (
              <div
                key={day.toISOString()}
                onClick={() => onDayClick(day)}
                className={`fs-cell h-[60px] sm:h-[110px] p-1 sm:p-2 border-b border-r border-[var(--fs-border-light)] cursor-pointer transition-colors hover:bg-[var(--fs-bg)] ${today ? 'fs-cell-today' : ''} ${!inMonth ? 'opacity-30' : ''}`}
              >
                {/* Top row: date + shift icon */}
                <div className="flex items-start justify-between mb-0.5 sm:mb-1.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); onDateNumberClick(day) }}
                    className={`${today ? 'fs-today-num' : 'text-[10px] sm:text-xs font-medium hover:bg-[var(--fs-border-light)]'} w-4 h-4 sm:w-6 sm:h-6 flex items-center justify-center rounded-full transition -ml-0.5 sm:-ml-2 -mt-0.5 sm:-mt-1.5`}
                    style={!today ? { color: 'var(--fs-text-muted)' } : undefined}
                  >
                    {format(day, 'd')}
                  </button>
                  {shift && shift.type !== 'Off' && (
                    <span className="text-[8px] sm:text-xs leading-none opacity-80 mt-0.5 sm:mt-0">
                      {shift.type === 'Day' ? '☀️' : '🌙'}
                    </span>
                  )}
                </div>

                {/* Holiday — desktop only */}
                {holiday && (
                  <div className="hidden sm:block text-[9px] font-medium truncate leading-tight mb-0.5"
                    style={{ color: 'var(--fs-holiday)' }}>
                    🎉 {holiday}
                  </div>
                )}

                {/* Yearly event — desktop only */}
                {yearlyEvent && (
                  <div className="hidden sm:block text-[9px] font-medium truncate leading-tight mb-0.5"
                    style={{ color: 'var(--fs-honey-dark)' }}>
                    {yearlyEvent.label === 'Birthday' ? '🎂' : yearlyEvent.label === 'Anniversary' ? '💍' : yearlyEvent.label === 'Holiday' ? '🎉' : '📅'} {yearlyEvent.title}
                  </div>
                )}

                {/* Desktop: shift badge + appointment chips */}
                <div className="hidden sm:block">
                  {appts.slice(0, 2).map((a) => {
                    const color = getMemberColor(a.assigned_to, members)
                    return (
                      <div key={a.id}
                        onClick={(e) => { e.stopPropagation(); onApptClick(a) }}
                        className="fs-chip block mt-0.5 cursor-pointer hover:opacity-80 transition"
                        style={{ background: color + '22', color: color }}
                      >
                        {a.title}
                      </div>
                    )
                  })}
                  {appts.length > 2 && (
                    <button onClick={(e) => { e.stopPropagation(); onDateNumberClick(day) }}
                      className="text-[10px] mt-0.5 font-medium hover:opacity-80 transition"
                      style={{ color: 'var(--fs-text-muted)' }}>
                      +{appts.length - 2} more
                    </button>
                  )}
                </div>

                {/* Mobile: dot indicators */}
                {(appts.length > 0 || holiday || yearlyEvent) && (
                  <div className="flex sm:hidden gap-0.5 flex-wrap mt-1">
                    {holiday && <span className="text-[8px] sm:text-[10px] leading-none">🎉</span>}
                    {yearlyEvent && (
                      <span className="text-[8px] sm:text-[10px] leading-none">
                        {yearlyEvent.label === 'Birthday' ? '🎂' : yearlyEvent.label === 'Anniversary' ? '💍' : yearlyEvent.label === 'Holiday' ? '🎉' : '📅'}
                      </span>
                    )}
                    {appts.slice(0, 2).map((a) => (
                      <span key={a.id} className="fs-dot"
                        style={{ backgroundColor: getMemberColor(a.assigned_to, members) }} />
                    ))}
                    {appts.length > 2 && (
                      <span className="text-[7px] leading-none mt-0.5" style={{ color: 'var(--fs-text-muted)' }}>
                        +{appts.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {Array.from({ length: endPadding }).map((_, i) => (
            <div key={`end-pad-${i}`} className="h-[60px] sm:h-[110px] border-b border-r border-[var(--fs-border-light)]"
              style={{ background: 'var(--fs-bg)' }} />
          ))}
        </div>
      )}
    </div>
  )
}