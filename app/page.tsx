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

  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newAssignedTo, setNewAssignedTo] = useState('')
  const [saving, setSaving] = useState(false)

  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null)
  const [apptModalOpen, setApptModalOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

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
    return appointments.filter((a) => {
      // Strip time, just compare date string directly
      return a.event_date.slice(0, 10) === key
    })
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
                    onClick={() => {
                      setSelectedDay(day)
                      setNewTitle('')
                      setNewAssignedTo(members[0]?.name ?? '')
                      setModalOpen(true)
                    }}
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
                        className="text-xs rounded-md px-1.5 py-0.5 mb-0.5 text-white truncate cursor-pointer hover:opacity-80 transition"
                        style={{ backgroundColor: getMemberColor(a.assigned_to) }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedAppt(a)
                          setApptModalOpen(true)
                        }}
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
      {/* Add appointment modal */}
      {modalOpen && selectedDay && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-stone-800 mb-1">Add Appointment</h2>
            <p className="text-stone-400 text-sm mb-4">{format(selectedDay, 'MMMM d, yyyy')}</p>

            <input
              type="text"
              placeholder="Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-stone-300"
            />

            <select
              value={newAssignedTo}
              onChange={(e) => setNewAssignedTo(e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-stone-300"
            >
              {members.map((m) => (
                <option key={m.name} value={m.name}>{m.name}</option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 py-2 rounded-lg border border-stone-200 text-stone-600 text-sm hover:bg-stone-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!newTitle.trim()) return
                  setSaving(true)
                  await fetch('/api/appointments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      title: newTitle,
                      event_date: format(selectedDay, 'yyyy-MM-dd'),
                      assigned_to: newAssignedTo,
                    }),
                  })
                  // Refresh data
                  const eventsData = await fetch(`/api/events?month=${monthKey}`).then((r) => r.json())
                  setAppointments(eventsData.appointments || [])
                  setSaving(false)
                  setModalOpen(false)
                }}
                disabled={saving}
                className="flex-1 py-2 rounded-lg bg-stone-800 text-white text-sm hover:bg-stone-700 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
      {apptModalOpen && selectedAppt && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={() => setApptModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-stone-800 mb-1">{selectedAppt.title}</h2>
            <p className="text-stone-400 text-sm mb-1">{selectedAppt.event_date.slice(0, 10)}</p>
            <div className="flex items-center gap-1.5 mb-6">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getMemberColor(selectedAppt.assigned_to) }} />
              <span className="text-stone-600 text-sm">{selectedAppt.assigned_to}</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setApptModalOpen(false)}
                className="flex-1 py-2 rounded-lg border border-stone-200 text-stone-600 text-sm hover:bg-stone-50 transition"
              >
                Close
              </button>
              <button
                onClick={async () => {
                  setDeleting(true)
                  await fetch('/api/appointments', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: selectedAppt.id }),
                  })
                  const eventsData = await fetch(`/api/events?month=${monthKey}`).then((r) => r.json())
                  setAppointments(eventsData.appointments || [])
                  setDeleting(false)
                  setApptModalOpen(false)
                }}
                disabled={deleting}
                className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm transition disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}