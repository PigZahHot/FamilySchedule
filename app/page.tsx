'use client'

import { useState, useEffect, useRef } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns'
import { Appointment, FamilyMember, ShiftDay } from '@/app/types/calendar'
import CalendarGrid from '@/app/components/CalendarGrid'
import YearView from '@/app/components/YearView'
import AgendaView from '@/app/components/AgendaView'
import Legend from '@/app/components/Legend'
import AddEventModal from '@/app/components/AddAppointmentModal'
import AppointmentDetailModal from '@/app/components/AppointmentDetailModal'
import DayDetailModal from '@/app/components/DayDetailModal'

type MonthCache = {
  [monthKey: string]: { shiftDays: ShiftDay[]; appointments: Appointment[] }
}
type View = 'calendar' | 'agenda' | 'year'

function getMonthKey(date: Date) { return format(date, 'yyyy-MM') }
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
  const [activeView, setActiveView] = useState<View>('calendar')
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
    const newDate = direction === 'next' ? addMonths(activeDate, 1) : subMonths(activeDate, 1)
    setTimeout(async () => {
      setActiveDate(newDate)
      setSliding(false)
      const edgeMonth = direction === 'next' ? addMonths(newDate, 5) : subMonths(newDate, 5)
      const edgeKey = getMonthKey(edgeMonth)
      if (!cache[edgeKey]) {
        const eventsData = await fetch(`/api/events?month=${getMonthKey(newDate)}`).then((r) => r.json())
        setCache(buildCache(newDate, eventsData))
      }
    }, 150)
  }

  // Collect all cached data for year/agenda views
  const allShiftDays = Object.values(cache).flatMap((m) => m.shiftDays)
  const allAppointments = Object.values(cache).flatMap((m) => m.appointments)

  if (!activeDate || initialLoading) {
    return (
      <div className="fs-page">
        <div className="max-w-5xl mx-auto px-4 pt-4 pb-4">
          <div className="h-8 w-48 bg-[var(--fs-border)] animate-pulse rounded-lg mb-2" />
          <div className="h-4 w-32 bg-[var(--fs-border)] animate-pulse rounded-lg mb-6" />
          <div className="fs-card rounded-2xl overflow-hidden">
            <div className="grid grid-cols-7 border-b border-[var(--fs-border-light)]">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="py-3 flex justify-center">
                  <div className="w-6 h-3 bg-[var(--fs-border)] animate-pulse rounded" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: 42 }).map((_, i) => (
                <div key={i} className="h-[72px] sm:h-[120px] p-2 border-b border-r border-[var(--fs-border-light)]">
                  <div className="w-5 h-5 rounded-full bg-[var(--fs-border)] animate-pulse mb-2" />
                  <div className="h-2.5 rounded-lg bg-[var(--fs-border)] animate-pulse mb-1.5 w-3/4" />
                  <div className="h-2.5 rounded-lg bg-[var(--fs-border)] animate-pulse w-1/2" />
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
      body: JSON.stringify({ title: newTitle, event_date: format(selectedDay, 'yyyy-MM-dd'), assigned_to: newAssignedTo }),
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

  const tabs: { key: View; label: string }[] = [
    { key: 'calendar', label: 'Calendar' },
    { key: 'agenda', label: 'Agenda' },
    { key: 'year', label: 'Year' },
  ]

  return (
    <div className="fs-page">
      <div className="max-w-5xl mx-auto px-4 pt-6 pb-4">

        {/* Header */}
        <div className="fs-topbar rounded-2xl px-5 py-4 mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold" style={{ color: 'var(--fs-honey-dark)' }}>
              Family<span style={{ color: 'var(--fs-honey)' }}> </span>Schedule
            </h1>
            <p className="text-xs mt-0.5 transition-all duration-300" style={{ color: 'var(--fs-text-muted)' }}>
              {format(activeDate, 'MMMM yyyy')}
            </p>
          </div>
          {activeView === 'calendar' && (
            <div className="flex items-center gap-1.5">
              <button onClick={() => navigate('prev')} disabled={sliding}
                className="fs-icon-btn disabled:opacity-50">‹</button>
              <button
                onClick={() => {
                  const today = new Date()
                  if (getMonthKey(today) !== monthKey) {
                    slideDir.current = today > activeDate ? 'left' : 'right'
                    setSliding(true)
                    setTimeout(() => { setActiveDate(today); setSliding(false) }, 150)
                  }
                }}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition"
                style={{ background: 'var(--fs-surface)', color: 'var(--fs-text-muted)', border: '0.5px solid var(--fs-border)' }}
              >Today</button>
              <button onClick={() => navigate('next')} disabled={sliding}
                className="fs-icon-btn disabled:opacity-50">›</button>
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div className="fs-tab-bar rounded-xl mb-4 flex px-1 py-1 gap-1">
          {tabs.map((tab) => (
            <button key={tab.key}
              onClick={() => setActiveView(tab.key)}
              className={`fs-tab flex-1 rounded-lg ${activeView === tab.key ? 'active' : ''}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Legend — only on calendar view */}
        {activeView === 'calendar' && <Legend members={members} />}

        {/* Views */}
        {activeView === 'calendar' && (
          <div className="overflow-hidden rounded-2xl">
            <div style={{
              opacity: sliding ? 0 : 1,
              transform: sliding
                ? `translateX(${slideDir.current === 'left' ? '-12px' : '12px'})`
                : 'translateX(0)',
              transition: sliding
                ? 'opacity 150ms ease-in, transform 150ms ease-in'
                : 'opacity 200ms ease-out, transform 200ms ease-out',
            }}>
              <CalendarGrid
                days={days} activeDate={activeDate} shiftDays={monthData.shiftDays}
                appointments={monthData.appointments} members={members} loading={false}
                startPadding={startPadding} endPadding={endPadding}
                onDayClick={(day) => { setDayDetailDay(day); setDayDetailOpen(true) }}
                onApptClick={(appt) => { setSelectedAppt(appt); setApptModalOpen(true) }}
                onDateNumberClick={(day) => { setDayDetailDay(day); setDayDetailOpen(true) }}
              />
            </div>
          </div>
        )}

        {activeView === 'agenda' && (
          <AgendaView
            appointments={allAppointments}
            shiftDays={allShiftDays}
            members={members}
            onApptClick={(appt) => { setSelectedAppt(appt); setApptModalOpen(true) }}
            onAddClick={() => {
              setSelectedDay(null); setNewTitle(''); setNewAssignedTo(members[0]?.name ?? '')
              setModalOpen(true)
            }}
          />
        )}

        {activeView === 'year' && (
          <YearView
            activeDate={activeDate}
            allShiftDays={allShiftDays}
            allAppointments={allAppointments}
            members={members}
            onMonthClick={(date) => {
              setActiveDate(date)
              setActiveView('calendar')
            }}
            onDayClick={(day) => {
              setActiveDate(day)
              setDayDetailDay(day)
              setDayDetailOpen(true)
              setActiveView('calendar')
            }}
            onYearChange={async (year) => {
              const centerDate = new Date(year, 5, 1) // June of that year
              const eventsData = await fetch(`/api/events?month=${format(centerDate, 'yyyy-MM')}`).then((r) => r.json())
              setCache((prev) => ({ ...prev, ...buildCache(centerDate, eventsData) }))
            }}
          />
        )}
      </div>

      {modalOpen && (
        <AddEventModal
          selectedDay={selectedDay} members={members} newTitle={newTitle}
          newAssignedTo={newAssignedTo} saving={saving}
          onClose={() => setModalOpen(false)} onTitleChange={setNewTitle}
          onAssignedChange={setNewAssignedTo} onSave={handleSave}
        />
      )}
      {apptModalOpen && selectedAppt && (
        <AppointmentDetailModal
          appointment={selectedAppt} memberColor={getMemberColor(selectedAppt.assigned_to)}
          members={members} deleting={deleting} saving={editSaving}
          onClose={() => setApptModalOpen(false)} onDelete={handleDelete} onSave={handleEdit}
        />
      )}
      {dayDetailOpen && dayDetailDay && (
        <DayDetailModal
          day={dayDetailDay}
          appointments={monthData.appointments.filter(
            (a) => a.event_date.slice(0, 10) === format(dayDetailDay, 'yyyy-MM-dd')
          )}
          members={members} shiftDays={monthData.shiftDays}
          onClose={() => setDayDetailOpen(false)}
          onAddClick={() => {
            setSelectedDay(dayDetailDay); setNewTitle(''); setNewAssignedTo(members[0]?.name ?? '')
            setDayDetailOpen(false); setModalOpen(true)
          }}
          onApptClick={(appt) => { setSelectedAppt(appt); setDayDetailOpen(false); setApptModalOpen(true) }}
        />
      )}
    </div>
  )
}