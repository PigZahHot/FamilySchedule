import { FamilyMember } from '@/app/types/calendar'

interface LegendProps {
  members: FamilyMember[]
}

export default function Legend({ members }: LegendProps) {
  return (
    <div className="flex gap-2 mb-6 flex-wrap">
      {members.map((m) => (
        <div
          key={m.name}
          className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-sm text-sm text-stone-700 font-medium"
        >
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: m.theme_color }} />
          {m.name}
        </div>
      ))}
      <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-full px-3 py-1.5 text-sm text-amber-700 font-medium">
        ☀️ Day Shift
      </div>
      <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1.5 text-sm text-indigo-700 font-medium">
        🌙 Night Shift
      </div>
    </div>
  )
}