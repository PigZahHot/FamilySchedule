import { differenceInDays } from 'date-fns'

export type ShiftResult = {
    type: 'Day' | 'Night' | 'Off'
    label: string
}

const PHASE_LENGTH = 90 // 15 blocks × 6 days (4 on + 2 off)

export function calculateShift(
    date: Date,
    anchorDate: Date,
    anchorShiftType: 'Day' | 'Night'
): ShiftResult {
    const deltaDays = differenceInDays(date, anchorDate)

    const shiftValue = ((deltaDays % 6) + 6) % 6
    const isWorking = shiftValue < 4

    if (!isWorking) {
        return { type: 'Off', label: 'Off' }
    }

    const phaseIndex = Math.floor(deltaDays / PHASE_LENGTH)
    const rotationPhase = ((phaseIndex % 2) + 2) % 2

    const isDay =
        anchorShiftType === 'Day'
            ? rotationPhase === 0
            : rotationPhase === 1

    return isDay
        ? { type: 'Day', label: 'Day Shift' }
        : { type: 'Night', label: 'Night Shift' }
}