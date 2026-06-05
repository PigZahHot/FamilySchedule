export type ShiftResult = {
  type: 'Day' | 'Night' | 'Off'
  label: string
}

export type ShiftDay = {
  date: string
  shift: ShiftResult | null
}

export type Appointment = {
  id: number
  title: string
  event_date: string
  assigned_to: string
  is_routine: boolean
}

export type FamilyMember = {
  name: string
  theme_color: string
}