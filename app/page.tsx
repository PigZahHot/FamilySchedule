'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday } from 'date-fns'

type ShiftResult = {
  type: 'Day' | 'Night' | 'Off'
  label: string
}

type ShiftDay = {
  date: string
  shift: ShiftResult | null
}

type Appointment = {
  id: number
  title: string
  event_date: string
  assigned_to: string
  is_routine: boolean
}

type FamilyMember = {
  name: string
  theme_color: string
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CalendarPage() {
  const [activeDate, setActiveDate] = useState<Date | null>(null)

  useEffect(() => {
    setActiveDate(new Date())
  }, [])

  const [shiftDays, setShiftDays] = useState<ShiftDay[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)

  const monthKey = activeDate ? format(activeDate, 'yyyy-MM') : ''

  useEffect(() => {
    if (!activeDate) return
    setLoading(true)
    Promise.all([
      fetch(`/api/events?month=${monthKey}`).then((r) => r.json()),
      fetch('/api/members').then((r) => r.json()),
    ]).then(([eventsData, membersData]) => {
      setShiftDays(eventsData.shiftDays || [])
      setAppointments(eventsData.appointments || [])
      setMembers(membersData || [])
      setLoading(false)
    })
  }, [monthKey])

  if (!activeDate) return null

  const days = eachDayOfInterval({
    start: startOfMonth(activeDate),
    end: endOfMonth(activeDate),
  })

  const startPadding = getDay(startOfMonth(activeDate))
  const totalCells = 42
  const endPadding = totalCells - days.length - startPadding

  function getShift(date: Date): ShiftResult | null {
    const key = format(date, 'yyyy-MM-dd')
    return shiftDays.find((s) => s.date === key)?.shift ?? null
  }

  function getAppointments(date: Date): Appointment[] {
    const key = format(date, 'yyyy-MM-dd')
    return appointments.filter((a) => a.event_date.startsWith(key))
  }

  function getMemberColor(name: string): string {
    return members.find((m) => m.name === name)?.theme_color ?? '#94a3b8'
  }

  function shiftStyle(type: string) {
    if (type === 'Day') return { bg: 'bg-amber-100 text-amber-700', icon: '☀️' }
    if (type === 'Night') return { bg: 'bg-indigo-100 text-indigo-700', icon: '🌙' }
    return { bg: '', icon: '' }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f0e8' }}>
      {/* Header */}
      <div className="max-w-5xl mx-auto px-4 pt-8 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-stone-800 tracking-tight">
              Family Schedule
            </h1>
            <p className="text-stone-500 text-sm mt-1">
              {activeDate ? format(activeDate, 'MMMM yyyy') : ''}
            </p>
          </div>

          {/* Month navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => activeDate && setActiveDate(new Date(activeDate.getFullYear(), activeDate.getMonth() - 1))}
              className="w-9 h-9 rounded-full bg-white shadow-sm hover:shadow-md transition text-stone-600 flex items-center justify-center"
            >
              ‹
            </button>
            <button
              onClick={() => setActiveDate(new Date())}
              className="px-3 py-1 rounded-full bg-white shadow-sm hover:shadow-md transition text-stone-600 text-sm"
            >
              Today
            </button>
            <button
              onClick={() => activeDate && setActiveDate(new Date(activeDate.getFullYear(), activeDate.getMonth() + 1))}
              className="w-9 h-9 rounded-full bg-white shadow-sm hover:shadow-md transition text-stone-600 flex items-center justify-center"
            >
              ›
            </button>
          </div>
        </div>

        {/* Family member legend */}
        <div className="flex gap-3 mb-6 flex-wrap">
          {members.map((m) => (
            <div key={m.name} className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1 shadow-sm text-sm text-stone-700">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.theme_color }} />
              {m.name}
            </div>
          ))}
          <div className="flex items-center gap-1.5 bg-amber-50 rounded-full px-3 py-1 shadow-sm text-sm text-amber-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
            Day Shift
          </div>
          <div className="flex items-center gap-1.5 bg-indigo-50 rounded-full px-3 py-1 shadow-sm text-sm text-indigo-700">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-300" />
            Night Shift
          </div>
        </div>

        {/* Calendar grid */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-stone-100">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-3 text-center text-xs font-semibold text-stone-400 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          {loading ? (
            <div className="h-96 flex items-center justify-center text-stone-400 text-sm">
              Loading...
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {/* Empty padding cells */}
              {Array.from({ length: startPadding }).map((_, i) => (
                <div key={`pad-${i}`} className="h-[120px] border-b border-r border-stone-50" />
              ))}

              {/* Day cells */}
              {days.map((day) => {
                const shift = getShift(day)
                const appts = getAppointments(day)
                const today = isToday(day)
                const inMonth = isSameMonth(day, activeDate)

                return (
                  <div
                    key={day.toISOString()}
                    className={`h-[120px] p-2 border-b border-r border-stone-50 ${!inMonth ? 'opacity-40' : ''
                      }`}
                  >
                    {/* Date number */}
                    <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1 ${today
                      ? 'bg-stone-800 text-white'
                      : 'text-stone-600'
                      }`}>
                      {format(day, 'd')}
                    </div>

                    {/* Shift badge */}
                    {shift && shift.type !== 'Off' && (
                      <div className={`text-xs rounded-md px-1.5 py-0.5 mb-1 font-medium w-fit ${shiftStyle(shift.type).bg}`}>
                        {shiftStyle(shift.type).icon}
                      </div>
                    )}

                    {/* Appointments */}
                    {appts.map((a) => (
                      <div
                        key={a.id}
                        className="text-xs rounded-md px-1.5 py-0.5 mb-0.5 text-white truncate"
                        style={{ backgroundColor: getMemberColor(a.assigned_to) }}
                      >
                        {a.title}
                      </div>
                    ))}
                  </div>
                )
              })}
              {/* Empty padding cells */}
              {Array.from({ length: endPadding }).map((_, i) => (
                <div key={`end-pad-${i}`} className="h-[120px] border-b border-r border-stone-50" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}