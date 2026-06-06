import { useState } from 'react'
import { Appointment, FamilyMember } from '@/app/types/calendar'

interface Props {
  appointment: Appointment
  memberColor: string
  members: FamilyMember[]
  deleting: boolean
  saving: boolean
  onClose: () => void
  onDelete: () => void
  onSave: (updated: { title: string; assigned_to: string; event_date: string }) => void
}

export default function AppointmentDetailModal({
  appointment, memberColor, members, deleting, saving, onClose, onDelete, onSave
}: Props) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(appointment.title)
  const [assignedTo, setAssignedTo] = useState(appointment.assigned_to)
  const [eventDate, setEventDate] = useState(appointment.event_date.slice(0, 10))

  const dateStr = appointment.event_date.slice(0, 10)
  const [year, month, day] = dateStr.split('-')
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  const formatted = date.toLocaleDateString('en-US', {
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
        {!editing ? (
          // — View mode —
          <>
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-stone-800">{appointment.title}</h2>
              <p className="text-stone-400 text-sm mt-0.5">{formatted}</p>
            </div>

            <div className="flex items-center gap-2 bg-stone-50 rounded-xl px-4 py-3 mb-5">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: memberColor }}
              />
              <span className="text-stone-700 text-sm font-medium">{appointment.assigned_to}</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-500 text-sm font-medium hover:bg-stone-50 transition"
              >
                Close
              </button>
              <button
                onClick={() => setEditing(true)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-sm font-medium hover:bg-stone-50 transition"
              >
                Edit
              </button>
              <button
                onClick={onDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition disabled:opacity-40"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </>
        ) : (
          // — Edit mode —
          <>
            <h2 className="text-base font-semibold text-stone-800 mb-4">Edit Appointment</h2>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-300"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">Date</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-300"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-stone-500 mb-1 block">Assigned to</label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-300"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-500 text-sm font-medium hover:bg-stone-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => onSave({ title, assigned_to: assignedTo, event_date: eventDate })}
                disabled={saving || !title.trim()}
                className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-sm font-medium transition disabled:opacity-40"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}