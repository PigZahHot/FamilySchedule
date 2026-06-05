'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns'
import { Appointment, FamilyMember, ShiftDay } from '@/app/types/calendar'
import CalendarGrid from '@/app/components/CalendarGrid'
import Legend from '@/app/components/Legend'
import AddAppointmentModal from '@/app/components/AddAppointmentModal'
import AppointmentDetailModal from '@/app/components/AppointmentDetailModal'

export default function CalendarPage() {
  const [activeDate, setActiveDate] = useState<Date | null>(null)
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

  useEffect(() => {
    setActiveDate(new Date())
  }, [])

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

  function getMemberColor(name: string): string {
    return members.find((m) => m.name === name)?.theme_color ?? '#94a3b8'
  }

  async function refreshAppointments() {
    const eventsData = await fetch(`/api/events?month=${monthKey}`).then((r) => r.json())
    setAppointments(eventsData.appointments || [])
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

  return (
    <div className="page-wrapper">
      <div className="max-w-5xl mx-auto px-4 pt-8 pb-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-stone-800 tracking-tight">
              Family Schedule
            </h1>
            <p className="text-stone-400 text-sm mt-0.5">
              {format(activeDate, 'MMMM yyyy')}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveDate(new Date(activeDate.getFullYear(), activeDate.getMonth() - 1))}
              className="w-8 h-8 rounded-full bg-white shadow-sm hover:shadow-md transition text-stone-500 flex items-center justify-center text-lg"
            >
              ‹
            </button>
            <button
              onClick={() => setActiveDate(new Date())}
              className="px-3 py-1.5 rounded-full bg-white shadow-sm hover:shadow-md transition text-stone-500 text-xs font-semibold tracking-wide"
            >
              Today
            </button>
            <button
              onClick={() => setActiveDate(new Date(activeDate.getFullYear(), activeDate.getMonth() + 1))}
              className="w-8 h-8 rounded-full bg-white shadow-sm hover:shadow-md transition text-stone-500 flex items-center justify-center text-lg"
            >
              ›
            </button>
          </div>
        </div>

        {/* Legend */}
        <Legend members={members} />

        {/* Calendar */}
        <CalendarGrid
          days={days}
          activeDate={activeDate}
          shiftDays={shiftDays}
          appointments={appointments}
          members={members}
          loading={loading}
          startPadding={startPadding}
          endPadding={endPadding}
          onDayClick={(day) => {
            setSelectedDay(day)
            setNewTitle('')
            setNewAssignedTo(members[0]?.name ?? '')
            setModalOpen(true)
          }}
          onApptClick={(appt) => {
            setSelectedAppt(appt)
            setApptModalOpen(true)
          }}
        />
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
          deleting={deleting}
          onClose={() => setApptModalOpen(false)}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}