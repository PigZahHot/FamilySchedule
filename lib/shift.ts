import { differenceInDays } from 'date-fns'

export type ShiftResult = {
    type: 'Day' | 'Night' | 'Off'
    label: string
}

const PHASE_LENGTH = 90 // 90 days per work block
const EXTRA_GAP_NIGHT_TO_DAY = 1 // 1-day extra gap when switching from Night to Day
const EXTRA_GAP_DAY_TO_NIGHT = -1 // 1-day less gap when switching from Day to Night

const TOTAL_CYCLE_LENGTH = PHASE_LENGTH + EXTRA_GAP_NIGHT_TO_DAY + PHASE_LENGTH + EXTRA_GAP_DAY_TO_NIGHT // 184 days total

export function calculateShift(
    date: Date,
    anchorDate: Date,
    anchorShiftType: 'Day' | 'Night'
): ShiftResult {
    const deltaDays = differenceInDays(date, anchorDate)
    const cycleDay = ((deltaDays % TOTAL_CYCLE_LENGTH) + TOTAL_CYCLE_LENGTH) % TOTAL_CYCLE_LENGTH

    // 1. Check Day -> Night transition gap (1 day)
    if (cycleDay >= PHASE_LENGTH && cycleDay < PHASE_LENGTH + EXTRA_GAP_NIGHT_TO_DAY) {
        return { type: 'Off', label: 'Transition Off' }
    }

    // 2. Check Night -> Day transition gap (3 days at the end of the cycle)
    const nightToDayStart = PHASE_LENGTH + EXTRA_GAP_NIGHT_TO_DAY + PHASE_LENGTH
    if (cycleDay >= nightToDayStart) {
        return { type: 'Off', label: 'Transition Off' }
    }

    // 3. Adjust day counting for the second phase so it ignores the Day->Night gap offset
    let phaseIndex = 0
    let adjustedDay = cycleDay

    if (cycleDay >= PHASE_LENGTH + EXTRA_GAP_NIGHT_TO_DAY) {
        phaseIndex = 1
        adjustedDay = cycleDay - EXTRA_GAP_NIGHT_TO_DAY
    }

    const dayInPhase = adjustedDay % PHASE_LENGTH

    const isDay =
        anchorShiftType === 'Day'
            ? phaseIndex === 0
            : phaseIndex === 1

    // 4. Regular 4-on / 2-off calculation for the active work phase
    const shiftValue = dayInPhase % 6
    const isWorking = shiftValue < 4

    if (!isWorking) {
        return { type: 'Off', label: 'Off' }
    }

    return isDay
        ? { type: 'Day', label: 'Day Shift' }
        : { type: 'Night', label: 'Night Shift' }
}