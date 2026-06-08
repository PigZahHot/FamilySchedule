import { FamilyMember } from '@/app/types/calendar'

interface LegendProps { members: FamilyMember[] }

export default function Legend({ members }: LegendProps) {
  return (
    <div className="flex gap-2 mb-4 flex-wrap">
      {members.map((m) => (
        <div key={m.name} className="lpill">
          <span className="fs-dot flex-shrink-0" style={{ backgroundColor: m.theme_color }} />
          {m.name}
        </div>
      ))}
      <div className="lpill">
        <span className="fs-dot fs-dot-holiday" />
        Holiday
      </div>
    </div>
  )
}