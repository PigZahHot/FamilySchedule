export type ShiftResult = {
  type: 'Day' | 'Night' | 'Off'
  label: string
}

export type ShiftDay = {
  date: string
  shift: ShiftResult | null
  holiday?: string | null
  yearlyEvent?: { title: string; label: string } | null
}

export type Appointment = {
  id: number
  title: string
  event_date: string
  assigned_to: string
  is_routine: boolean
}

export type FamilyMember = {
  id: number
  name: string
  theme_color: string
}