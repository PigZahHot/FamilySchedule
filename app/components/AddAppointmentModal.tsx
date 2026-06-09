import { format } from 'date-fns'
import { useState } from 'react'
import { FamilyMember } from '@/app/types/calendar'

interface Props {
  selectedDay: Date | null
  members: FamilyMember[]
  newTitle: string
  newAssignedTo: string
  saving: boolean
  onClose: () => void
  onTitleChange: (val: string) => void
  onAssignedChange: (val: string) => void
  onSave: (date?: string) => void
}

const inputStyle = { border: '0.5px solid var(--fs-border)', background: 'var(--fs-bg)', color: 'var(--fs-text)' }

export default function AddEventModal({
  selectedDay, members, newTitle, newAssignedTo,
  saving, onClose, onTitleChange, onAssignedChange, onSave
}: Props) {
  const [pickedDate, setPickedDate] = useState(
    selectedDay ? format(selectedDay, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  )

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="fs-card rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5">
          <h2 className="text-base font-semibold" style={{ color: 'var(--fs-text)' }}>Add Event</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--fs-text-muted)' }}>
            {selectedDay ? format(selectedDay, 'EEEE, MMMM d, yyyy') : 'Choose a date'}
          </p>
        </div>

        {/* Date picker — only shown when no day is pre-selected (agenda view) */}
        {!selectedDay && (
          <input type="date" value={pickedDate}
            onChange={(e) => setPickedDate(e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none"
            style={inputStyle}
          />
        )}

        <input type="text" placeholder="What's the event?" value={newTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSave(selectedDay ? undefined : pickedDate)}
          autoFocus
          className="w-full rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none"
          style={inputStyle}
        />

        <select value={newAssignedTo} onChange={(e) => onAssignedChange(e.target.value)}
          className="w-full rounded-xl px-4 py-2.5 text-sm mb-5 focus:outline-none"
          style={inputStyle}
        >
          {members.map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
        </select>

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition hover:opacity-80"
            style={{ border: '0.5px solid var(--fs-border)', color: 'var(--fs-text-muted)' }}>
            Cancel
          </button>
          <button onClick={() => onSave(selectedDay ? undefined : pickedDate)}
            disabled={saving || !newTitle.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-40"
            style={{ background: 'var(--fs-honey)', color: '#fff' }}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}