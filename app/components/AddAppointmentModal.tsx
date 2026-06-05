import { format } from 'date-fns'
import { FamilyMember } from '@/app/types/calendar'

interface Props {
  selectedDay: Date
  members: FamilyMember[]
  newTitle: string
  newAssignedTo: string
  saving: boolean
  onClose: () => void
  onTitleChange: (val: string) => void
  onAssignedChange: (val: string) => void
  onSave: () => void
}

export default function AddAppointmentModal({
  selectedDay, members, newTitle, newAssignedTo,
  saving, onClose, onTitleChange, onAssignedChange, onSave
}: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 border border-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-stone-800">Add Appointment</h2>
          <p className="text-stone-400 text-sm mt-0.5">{format(selectedDay, 'EEEE, MMMM d, yyyy')}</p>
        </div>

        <input
          type="text"
          placeholder="What's the appointment?"
          value={newTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSave()}
          autoFocus
          className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent placeholder:text-stone-300"
        />

        <select
          value={newAssignedTo}
          onChange={(e) => onAssignedChange(e.target.value)}
          className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent text-stone-700"
        >
          {members.map((m) => (
            <option key={m.name} value={m.name}>{m.name}</option>
          ))}
        </select>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-500 text-sm font-medium hover:bg-stone-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving || !newTitle.trim()}
            className="flex-1 py-2.5 rounded-xl bg-stone-800 text-white text-sm font-medium hover:bg-stone-700 transition disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}