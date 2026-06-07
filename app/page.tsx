'use client'

import { useState, useEffect, useRef } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns'
import { Appointment, FamilyMember, ShiftDay } from '@/app/types/calendar'
import CalendarGrid from '@/app/components/CalendarGrid'
import Legend from '@/app/components/Legend'
import AddAppointmentModal from '@/app/components/AddAppointmentModal'
import AppointmentDetailModal from '@/app/components/AppointmentDetailModal'
import DayDetailModal from '@/app/components/DayDetailModal'

type MonthCache = {
  [monthKey: string]: {
    shiftDays: ShiftDay[]
    appointments: Appointment[]
  }
}

function getMonthKey(date: Date) {
  return format(date, 'yyyy-MM')
}

function getMonthDays(date: Date) {
  const days = eachDayOfInterval({ start: startOfMonth(date), end: endOfMonth(date) })
  const startPadding = getDay(startOfMonth(date))
  const endPadding = 42 - days.length - startPadding
  return { days, startPadding, endPadding }
}

export default function CalendarPage() {
  const [activeDate, setActiveDate] = useState<Date | null>(null)
  const [cache, setCache] = useState<MonthCache>({})
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [sliding, setSliding] = useState(false)
  const slideDir = useRef<'left' | 'right' | null>(null)

  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newAssignedTo, setNewAssignedTo] = useState('')
  const [saving, setSaving] = useState(false)

  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null)
  const [apptModalOpen, setApptModalOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [dayDetailOpen, setDayDetailOpen] = useState(false)
  const [dayDetailDay, setDayDetailDay] = useState<Date | null>(null)
  const [editSaving, setEditSaving] = useState(false)

  useEffect(() => {
    const today = new Date()
    setActiveDate(today)
    Promise.all([
      fetch(`/api/events?month=${getMonthKey(today)}`).then((r) => r.json()),
      fetch('/api/members').then((r) => r.json()),
    ]).then(([eventsData, membersData]) => {
      setCache(buildCache(today, eventsData))
      setMembers(membersData || [])
      setInitialLoading(false)
    })
  }, [])

  function buildCache(centerDate: Date, eventsData: { shiftDays: ShiftDay[]; appointments: Appointment[] }): MonthCache {
    const newCache: MonthCache = {}
    for (let offset = -5; offset <= 5; offset++) {
      const month = addMonths(centerDate, offset)
      const key = getMonthKey(month)
      const monthStart = format(startOfMonth(month), 'yyyy-MM-dd')
      const monthEnd = format(endOfMonth(month), 'yyyy-MM-dd')
      newCache[key] = {
        shiftDays: eventsData.shiftDays.filter((s) => s.date >= monthStart && s.date <= monthEnd),
        appointments: eventsData.appointments.filter(
          (a) => a.event_date.slice(0, 10) >= monthStart && a.event_date.slice(0, 10) <= monthEnd
        ),
      }
    }
    return newCache
  }

  async function navigate(direction: 'prev' | 'next') {
    if (!activeDate || sliding) return
    slideDir.current = direction === 'next' ? 'left' : 'right'
    setSliding(true)

    const newDate = direction === 'next'
      ? addMonths(activeDate, 1)
      : subMonths(activeDate, 1)

    setTimeout(async () => {
      setActiveDate(newDate)
      setSliding(false)

      // Check if the new edge month is cached
      const edgeMonth = direction === 'next'
        ? addMonths(newDate, 5)
        : subMonths(newDate, 5)
      const edgeKey = getMonthKey(edgeMonth)

      if (!cache[edgeKey]) {
        // Fetch fresh 5-month window centered on new date
        const eventsData = await fetch(`/api/events?month=${getMonthKey(newDate)}`).then((r) => r.json())
        setCache(buildCache(newDate, eventsData))
      }
    }, 300)
  }

  if (!activeDate || initialLoading) {
    return (
      <div className="page-wrapper">
        <div className="max-w-5xl mx-auto px-4 pt-8 pb-12">
          <div className="h-8 w-48 bg-stone-100 animate-pulse rounded-lg mb-2" />
          <div className="h-4 w-32 bg-stone-100 animate-pulse rounded-lg mb-6" />
          <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
            <div className="grid grid-cols-7 border-b border-stone-100">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="py-3 flex justify-center">
                  <div className="w-6 h-3 bg-stone-100 animate-pulse rounded" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: 42 }).map((_, i) => (
                <div key={i} className="h-[72px] sm:h-[120px] p-2 border-b border-r border-stone-50">
                  <div className="w-5 h-5 rounded-full bg-stone-100 animate-pulse mb-2" />
                  <div className="h-2.5 rounded-lg bg-stone-100 animate-pulse mb-1.5 w-3/4" />
                  <div className="h-2.5 rounded-lg bg-stone-100 animate-pulse w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const monthKey = getMonthKey(activeDate)
  const monthData = cache[monthKey] ?? { shiftDays: [], appointments: [] }
  const { days, startPadding, endPadding } = getMonthDays(activeDate)

  function getMemberColor(name: string): string {
    return members.find((m) => m.name === name)?.theme_color ?? '#94a3b8'
  }

  async function refreshAppointments() {
    if (!activeDate) return
    const eventsData = await fetch(`/api/events?month=${monthKey}`).then((r) => r.json())
    setCache(buildCache(activeDate, eventsData))
  }

  async function handleSave() {
    if (!newTitle.trim() || !selectedDay) return
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
    await refreshAppointments()
    setSaving(false)
    setModalOpen(false)
  }

  async function handleDelete() {
    if (!selectedAppt) return
    setDeleting(true)
    await fetch('/api/appointments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selectedAppt.id }),
    })
    await refreshAppointments()
    setDeleting(false)
    setApptModalOpen(false)
  }

  async function handleEdit(updated: { title: string; assigned_to: string; event_date: string }) {
    if (!selectedAppt) return
    setEditSaving(true)
    await fetch('/api/appointments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selectedAppt.id, ...updated }),
    })
    await refreshAppointments()
    setEditSaving(false)
    setApptModalOpen(false)
  }

  return (
    <div className="page-wrapper">
      <div className="max-w-5xl mx-auto px-4 pt-8 pb-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-stone-800 tracking-tight">
              Family Schedule
            </h1>
            <p className="text-stone-400 text-sm mt-0.5 transition-all duration-300">
              {format(activeDate, 'MMMM yyyy')}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate('prev')}
              disabled={sliding}
              className="w-8 h-8 rounded-full bg-white shadow-sm hover:shadow-md transition text-stone-500 flex items-center justify-center text-lg disabled:opacity-50"
            >
              ‹
            </button>
            <button
              onClick={() => {
                const today = new Date()
                if (getMonthKey(today) !== monthKey) {
                  slideDir.current = today > activeDate ? 'left' : 'right'
                  setSliding(true)
                  setTimeout(() => {
                    setActiveDate(today)
                    setSliding(false)
                  }, 300)
                }
              }}
              className="px-3 py-1.5 rounded-full bg-white shadow-sm hover:shadow-md transition text-stone-500 text-xs font-semibold tracking-wide"
            >
              Today
            </button>
            <button
              onClick={() => navigate('next')}
              disabled={sliding}
              className="w-8 h-8 rounded-full bg-white shadow-sm hover:shadow-md transition text-stone-500 flex items-center justify-center text-lg disabled:opacity-50"
            >
              ›
            </button>
          </div>
        </div>

        {/* Legend */}
        <Legend members={members} />

        {/* Carousel wrapper */}
        <div className="overflow-hidden rounded-2xl">
          <div
            className="transition-transform duration-300 ease-in-out"
            style={{
              transform: sliding
                ? `translateX(${slideDir.current === 'left' ? '-4%' : '4%'})`
                : 'translateX(0)',
              opacity: sliding ? 0.6 : 1,
              transition: 'transform 300ms ease-in-out, opacity 300ms ease-in-out',
            }}
          >
            <CalendarGrid
              days={days}
              activeDate={activeDate}
              shiftDays={monthData.shiftDays}
              appointments={monthData.appointments}
              members={members}
              loading={false}
              startPadding={startPadding}
              endPadding={endPadding}
              onDayClick={(day) => {
                setDayDetailDay(day)
                setDayDetailOpen(true)
              }}
              onApptClick={(appt) => {
                setSelectedAppt(appt)
                setApptModalOpen(true)
              }}
              onDateNumberClick={(day) => {
                setDayDetailDay(day)
                setDayDetailOpen(true)
              }}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {modalOpen && selectedDay && (
        <AddAppointmentModal
          selectedDay={selectedDay}
          members={members}
          newTitle={newTitle}
          newAssignedTo={newAssignedTo}
          saving={saving}
          onClose={() => setModalOpen(false)}
          onTitleChange={setNewTitle}
          onAssignedChange={setNewAssignedTo}
          onSave={handleSave}
        />
      )}

      {apptModalOpen && selectedAppt && (
        <AppointmentDetailModal
          appointment={selectedAppt}
          memberColor={getMemberColor(selectedAppt.assigned_to)}
          members={members}
          deleting={deleting}
          saving={editSaving}
          onClose={() => setApptModalOpen(false)}
          onDelete={handleDelete}
          onSave={handleEdit}
        />
      )}

      {dayDetailOpen && dayDetailDay && (
        <DayDetailModal
          day={dayDetailDay}
          appointments={monthData.appointments.filter(
            (a) => a.event_date.slice(0, 10) === format(dayDetailDay, 'yyyy-MM-dd')
          )}
          members={members}
          shiftDays={monthData.shiftDays}
          onClose={() => setDayDetailOpen(false)}
          onAddClick={() => {
            setSelectedDay(dayDetailDay)
            setNewTitle('')
            setNewAssignedTo(members[0]?.name ?? '')
            setDayDetailOpen(false)
            setModalOpen(true)
          }}
          onApptClick={(appt) => {
            setSelectedAppt(appt)
            setDayDetailOpen(false)
            setApptModalOpen(true)
          }}
        />
      )}
    </div>
  )
}