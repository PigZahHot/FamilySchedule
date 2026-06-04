import { differenceInDays, differenceInMonths } from 'date-fns'

export type ShiftResult = {
    type: 'Day' | 'Night' | 'Off'
    label: string
}

export function calculateShift(
    date: Date,
    anchorDate: Date,
    anchorShiftType: 'Day' | 'Night'
): ShiftResult {
    const deltaDays = differenceInDays(date, anchorDate)
    const shiftValue = ((deltaDays % 6) + 6) % 6 // handle negative modulo

    const elapsedMonths = differenceInMonths(date, anchorDate)
    const rotationPhase = Math.floor(elapsedMonths / 3) % 2

    const isWorking = shiftValue < 4

    if (!isWorking) {
        return { type: 'Off', label: 'Off' }
    }

    // Flip day/night based on rotation phase
    const isDay =
        anchorShiftType === 'Day'
            ? rotationPhase === 0
            : rotationPhase === 1

    return isDay
        ? { type: 'Day', label: 'Day Shift' }
        : { type: 'Night', label: 'Night Shift' }
}