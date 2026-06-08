import { useState } from 'react'
import { Appointment, FamilyMember } from '@/app/types/calendar'

interface Props {
  appointment: Appointment; memberColor: string; members: FamilyMember[]
  deleting: boolean; saving: boolean
  onClose: () => void; onDelete: () => void
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
  const formatted = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const inputStyle = { border: '0.5px solid var(--fs-border)', background: 'var(--fs-bg)', color: 'var(--fs-text)' }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="fs-card rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
        {!editing ? (
          <>
            <div className="mb-5">
              <h2 className="text-base font-semibold" style={{ color: 'var(--fs-text)' }}>{appointment.title}</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--fs-text-muted)' }}>{formatted}</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl px-4 py-3 mb-5"
              style={{ background: 'var(--fs-bg)', border: '0.5px solid var(--fs-border)' }}>
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: memberColor }} />
              <span className="text-sm font-medium" style={{ color: 'var(--fs-text)' }}>{appointment.assigned_to}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition hover:opacity-80"
                style={{ border: '0.5px solid var(--fs-border)', color: 'var(--fs-text-muted)' }}>Close</button>
              <button onClick={() => setEditing(true)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition hover:opacity-80"
                style={{ border: '0.5px solid var(--fs-border)', color: 'var(--fs-text)' }}>Edit</button>
              <button onClick={onDelete} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-40"
                style={{ background: '#ef4444', color: '#fff' }}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--fs-text)' }}>Edit Appointment</h2>
            <div className="space-y-3 mb-5">
              {[
                { label: 'Title', el: <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none" style={inputStyle} /> },
                { label: 'Date', el: <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none" style={inputStyle} /> },
                {
                  label: 'Assigned to', el: (
                    <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none" style={inputStyle}>
                      {members.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
                    </select>
                  )
                },
              ].map(({ label, el }) => (
                <div key={label}>
                  <label className="fs-section-label mb-1 block">{label}</label>
                  {el}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition hover:opacity-80"
                style={{ border: '0.5px solid var(--fs-border)', color: 'var(--fs-text-muted)' }}>Cancel</button>
              <button onClick={() => onSave({ title, assigned_to: assignedTo, event_date: eventDate })}
                disabled={saving || !title.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-40"
                style={{ background: 'var(--fs-honey)', color: '#fff' }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}