'use client'

import { useState, useEffect, useRef } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns'
import { Appointment, FamilyMember, ShiftDay } from '@/app/types/calendar'
import CalendarGrid from '@/app/components/CalendarGrid'
import MiniCalendar from '@/app/components/MiniCalendar'
import YearView from '@/app/components/YearView'
import AgendaView from '@/app/components/AgendaView'
import Legend from '@/app/components/Legend'
import AddEventModal from '@/app/components/AddAppointmentModal'
import AppointmentDetailModal from '@/app/components/AppointmentDetailModal'
import DayDetailModal from '@/app/components/DayDetailModal'
import MonthYearPicker from '@/app/components/MonthYearPicker'

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

// Animation state type
type AnimState = 'idle' | 'exit' | 'enter'

export default function CalendarPage() {
  const [activeDate, setActiveDate] = useState<Date | null>(null)
  const [displayDate, setDisplayDate] = useState<Date | null>(null) // what's currently visible
  const [cache, setCache] = useState<MonthCache>({})
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [animState, setAnimState] = useState<AnimState>('idle')
  const [animDir, setAnimDir] = useState<'left' | 'right'>('left')
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

  const [pickerOpen, setPickerOpen] = useState(false)

  useEffect(() => {
    const today = new Date()
    setActiveDate(today)
    setDisplayDate(today)
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
    if (!activeDate || animState !== 'idle') return
    const dir = direction === 'next' ? 'left' : 'right'
    const newDate = direction === 'next' ? addMonths(activeDate, 1) : subMonths(activeDate, 1)
    slideDir.current = dir
    setAnimDir(dir)
    setAnimState('exit')

    setTimeout(() => {
      setActiveDate(newDate)
      setDisplayDate(newDate)
      setAnimState('enter')
      setTimeout(() => {
        setAnimState('idle')
      }, 400)

      // Prefetch edge month
      const edgeMonth = direction === 'next' ? addMonths(newDate, 5) : subMonths(newDate, 5)
      const edgeKey = getMonthKey(edgeMonth)
      if (!cache[edgeKey]) {
        fetch(`/api/events?month=${getMonthKey(newDate)}`).then((r) => r.json())
          .then((eventsData) => setCache((prev) => ({ ...prev, ...buildCache(newDate, eventsData) })))
      }
    }, 400)
  }

  function getMainAnimClass() {
    if (animState === 'idle') return ''
    if (animDir === 'left') return animState === 'exit' ? 'anim-main-next-exit' : 'anim-main-next-enter'
    return animState === 'exit' ? 'anim-main-prev-exit' : 'anim-main-prev-enter'
  }

  function getLeftAnimClass() {
    if (animState === 'idle') return ''
    if (animDir === 'left') return animState === 'exit' ? 'anim-left-next-exit' : 'anim-left-next-enter'
    return animState === 'exit' ? 'anim-left-prev-exit' : 'anim-left-prev-enter'
  }

  function getRightAnimClass() {
    if (animState === 'idle') return ''
    if (animDir === 'left') return animState === 'exit' ? 'anim-right-next-exit' : 'anim-right-next-enter'
    return animState === 'exit' ? 'anim-right-prev-exit' : 'anim-right-prev-enter'
  }

  const allShiftDays = Object.values(cache).flatMap((m) => m.shiftDays)
  const allAppointments = Object.values(cache).flatMap((m) => m.appointments)

  if (!activeDate || !displayDate || initialLoading) {
    return (
      <div className="fs-page">
        <div className="max-w-[1600px] mx-auto px-4 pt-4 pb-4">
          <div className="max-w-5xl mx-auto">
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
      </div>
    )
  }

  const monthKey = getMonthKey(activeDate)
  const monthData = cache[monthKey] ?? { shiftDays: [], appointments: [] }
  const { days, startPadding, endPadding } = getMonthDays(activeDate)

  const prevDate = subMonths(activeDate, 1)
  const nextDate = addMonths(activeDate, 1)
  const prevData = cache[getMonthKey(prevDate)] ?? { shiftDays: [], appointments: [] }
  const nextData = cache[getMonthKey(nextDate)] ?? { shiftDays: [], appointments: [] }

  function getMemberColor(name: string): string {
    return members.find((m) => m.name === name)?.theme_color ?? '#94a3b8'
  }

  async function refreshAppointments() {
    if (!activeDate) return
    const eventsData = await fetch(`/api/events?month=${monthKey}`).then((r) => r.json())
    setCache(buildCache(activeDate, eventsData))
  }

  async function handleSave(dateOverride?: string) {
    if (!newTitle.trim()) return
    const eventDate = dateOverride ?? (selectedDay ? format(selectedDay, 'yyyy-MM-dd') : null)
    if (!eventDate) return
    setSaving(true)
    await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, event_date: eventDate, assigned_to: newAssignedTo }),
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
      <style>{`
        .anim-main-next-exit,
        .anim-main-next-enter,
        .anim-main-prev-exit,
        .anim-main-prev-enter { transform-origin: bottom center; }

        .anim-main-next-exit { animation: mainNextExit 400ms cubic-bezier(0.4, 0, 1, 1) forwards; }
        .anim-main-next-enter { animation: mainNextEnter 400ms cubic-bezier(0, 0, 0.2, 1) forwards; }
        .anim-main-prev-exit { animation: mainPrevExit 400ms cubic-bezier(0.4, 0, 1, 1) forwards; }
        .anim-main-prev-enter { animation: mainPrevEnter 400ms cubic-bezier(0, 0, 0.2, 1) forwards; }

        @keyframes mainNextExit {
          from { opacity: 1; transform: translateX(0) scale(1); }
          to { opacity: 0.2; transform: translateX(-330px) scale(0.5); }
        }
        @keyframes mainNextEnter {
          from { opacity: 0.2; transform: translateX(330px) scale(0.5); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes mainPrevExit {
          from { opacity: 1; transform: translateX(0) scale(1); }
          to { opacity: 0.2; transform: translateX(330px) scale(0.5); }
        }
        @keyframes mainPrevEnter {
          from { opacity: 0.2; transform: translateX(-330px) scale(0.5); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }

        .anim-left-next-exit,
        .anim-left-next-enter,
        .anim-left-prev-exit,
        .anim-left-prev-enter { transform-origin: bottom center; }

        .anim-left-next-exit { animation: leftNextExit 400ms cubic-bezier(0.4, 0, 1, 1) forwards; }
        .anim-left-next-enter { animation: leftNextEnter 400ms cubic-bezier(0, 0, 0.2, 1) forwards; }
        .anim-left-prev-exit { animation: leftPrevExit 400ms cubic-bezier(0.4, 0, 1, 1) forwards; }
        .anim-left-prev-enter { animation: leftPrevEnter 400ms cubic-bezier(0, 0, 0.2, 1) forwards; }

        @keyframes leftNextExit {
          from { opacity: 1; transform: translateX(0) scale(1); }
          to { opacity: 0; transform: translateX(-330px) scale(0.5); }
        }
        @keyframes leftNextEnter {
          from { opacity: 0.2; transform: translateX(330px) scale(2.0); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes leftPrevExit {
          from { opacity: 1; transform: translateX(0) scale(1); }
          to { opacity: 0.2; transform: translateX(330px) scale(2.0); }
        }
        @keyframes leftPrevEnter {
          from { opacity: 0; transform: translateX(-330px) scale(0.5); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }

        .anim-right-next-exit,
        .anim-right-next-enter,
        .anim-right-prev-exit,
        .anim-right-prev-enter { transform-origin: bottom center; }

        .anim-right-next-exit { animation: rightNextExit 400ms cubic-bezier(0.4, 0, 1, 1) forwards; }
        .anim-right-next-enter { animation: rightNextEnter 400ms cubic-bezier(0, 0, 0.2, 1) forwards; }
        .anim-right-prev-exit { animation: rightPrevExit 400ms cubic-bezier(0.4, 0, 1, 1) forwards; }
        .anim-right-prev-enter { animation: rightPrevEnter 400ms cubic-bezier(0, 0, 0.2, 1) forwards; }

        @keyframes rightNextExit {
          from { opacity: 1; transform: translateX(0) scale(1); }
          to { opacity: 0.2; transform: translateX(-330px) scale(2.0); }
        }
        @keyframes rightNextEnter {
          from { opacity: 0; transform: translateX(330px) scale(0.5); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes rightPrevExit {
          from { opacity: 1; transform: translateX(0) scale(1); }
          to { opacity: 0; transform: translateX(330px) scale(0.5); }
        }
        @keyframes rightPrevEnter {
          from { opacity: 0.2; transform: translateX(-330px) scale(2.0); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
      <div className="max-w-[1600px] mx-auto px-4 pt-6 pb-4">

        {/* Header */}
        <div className="max-w-5xl mx-auto fs-topbar rounded-2xl px-5 py-4 mb-4 flex items-center justify-between">
          <div className="relative">
            <h1 className="text-lg font-semibold" style={{ color: 'var(--fs-honey-dark)' }}>
              Family<span style={{ color: 'var(--fs-honey)' }}> </span>Schedule
            </h1>
            <button
              onClick={() => setPickerOpen((o) => !o)}
              className="text-xs mt-0.5 transition-all duration-300 flex items-center gap-1 hover:opacity-70"
              style={{ color: 'var(--fs-text-muted)' }}
            >
              {format(activeDate, 'MMMM yyyy')}
              <span style={{ fontSize: '10px' }}>{pickerOpen ? '▲' : '▼'}</span>
            </button>
            {pickerOpen && (
              <MonthYearPicker
                activeDate={activeDate}
                onSelect={(date) => {
                  setPickerOpen(false)
                  setAnimDir(date > activeDate ? 'left' : 'right')
                  setAnimState('exit')
                  setTimeout(() => {
                    setActiveDate(date)
                    setDisplayDate(date)
                    setAnimState('enter')
                    setTimeout(() => setAnimState('idle'), 300)
                    if (!cache[getMonthKey(date)]) {
                      fetch(`/api/events?month=${getMonthKey(date)}`).then((r) => r.json())
                        .then((eventsData) => setCache((prev) => ({ ...prev, ...buildCache(date, eventsData) })))
                    }
                  }, 200)
                }}
                onClose={() => setPickerOpen(false)}
              />
            )}
          </div>
          {activeView === 'calendar' && (
            <div className="flex items-center gap-1.5">
              <button onClick={() => navigate('prev')} disabled={animState !== 'idle'}
                className="fs-icon-btn disabled:opacity-50">‹</button>
              <button
                onClick={() => {
                  const today = new Date()
                  if (getMonthKey(today) !== monthKey) {
                    setAnimDir(today > activeDate ? 'left' : 'right')
                    setAnimState('exit')
                    setTimeout(() => {
                      setActiveDate(today)
                      setDisplayDate(today)
                      setAnimState('enter')
                      setTimeout(() => setAnimState('idle'), 300)
                    }, 200)
                  }
                }}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition"
                style={{ background: 'var(--fs-surface)', color: 'var(--fs-text-muted)', border: '0.5px solid var(--fs-border)' }}
              >Today</button>
              <button onClick={() => navigate('next')} disabled={animState !== 'idle'}
                className="fs-icon-btn disabled:opacity-50">›</button>
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div className="max-w-5xl mx-auto fs-tab-bar rounded-xl mb-4 flex px-1 py-1 gap-1">
          {tabs.map((tab) => (
            <button key={tab.key}
              onClick={() => setActiveView(tab.key)}
              className={`fs-tab flex-1 rounded-lg ${activeView === tab.key ? 'active' : ''}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Legend — only on calendar view */}
        <div className="max-w-5xl mx-auto">
          {activeView === 'calendar' && <Legend members={members} />}
        </div>

        {/* ===== CALENDAR VIEW ===== */}
        {activeView === 'calendar' && (
          <div className="flex flex-col lg:flex-row items-end justify-center gap-4 lg:gap-6 mt-4">
            {/* Desktop: left mini calendar (Previous Month) */}
            <div className="hidden lg:block w-56 xl:w-64 shrink-0">
              <div className={getLeftAnimClass()}>
                <MiniCalendar
                  date={prevDate}
                  shiftDays={prevData.shiftDays}
                  appointments={prevData.appointments}
                  members={members}
                  label={format(prevDate, 'MMMM yyyy')}
                  onClick={() => navigate('prev')}
                />
              </div>
            </div>

            {/* Main calendar */}
            <div className="flex-1 w-full max-w-5xl min-w-0">
              <div className={getMainAnimClass()} style={{ overflow: 'hidden', borderRadius: '16px' }}>
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

            {/* Desktop: right mini calendar (Next Month) */}
            <div className="hidden lg:block w-56 xl:w-64 shrink-0">
              <div className={getRightAnimClass()}>
                <MiniCalendar
                  date={nextDate}
                  shiftDays={nextData.shiftDays}
                  appointments={nextData.appointments}
                  members={members}
                  label={format(nextDate, 'MMMM yyyy')}
                  onClick={() => navigate('next')}
                />
              </div>
            </div>
          </div>
        )}

        {/* ===== AGENDA VIEW ===== */}
        {activeView === 'agenda' && (
          <div className="max-w-5xl mx-auto">
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
          </div>
        )}

        {/* ===== YEAR VIEW ===== */}
        {activeView === 'year' && (
          <div className="max-w-5xl mx-auto">
            <YearView
              activeDate={activeDate}
              allShiftDays={allShiftDays}
              allAppointments={allAppointments}
              members={members}
              onMonthClick={(date) => {
                setActiveDate(date)
                setDisplayDate(date)
                setActiveView('calendar')
              }}
              onDayClick={(day) => {
                setActiveDate(day)
                setDisplayDate(day)
                setDayDetailDay(day)
                setDayDetailOpen(true)
                setActiveView('calendar')
              }}
              onYearChange={async (year) => {
                const centerDate = new Date(year, 5, 1)
                const eventsData = await fetch(`/api/events?month=${format(centerDate, 'yyyy-MM')}`).then((r) => r.json())
                setCache((prev) => ({ ...prev, ...buildCache(centerDate, eventsData) }))
              }}
            />
          </div>
        )}
      </div>

      {/* ===== MODALS ===== */}
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