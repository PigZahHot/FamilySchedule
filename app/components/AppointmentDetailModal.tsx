import { Appointment } from '@/app/types/calendar'

interface Props {
  appointment: Appointment
  memberColor: string
  deleting: boolean
  onClose: () => void
  onDelete: () => void
}

export default function AppointmentDetailModal({
  appointment, memberColor, deleting, onClose, onDelete
}: Props) {
  const dateStr = appointment.event_date.slice(0, 10)
  const [year, month, day] = dateStr.split('-')
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  const formatted = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

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
          <h2 className="text-lg font-semibold text-stone-800">{appointment.title}</h2>
          <p className="text-stone-400 text-sm mt-0.5">{formatted}</p>
        </div>

        <div className="flex items-center gap-2 bg-stone-50 rounded-xl px-4 py-3 mb-5">
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: memberColor }} />
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
            onClick={onDelete}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition disabled:opacity-40"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}