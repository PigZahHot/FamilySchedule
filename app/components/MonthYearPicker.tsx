'use client'

import { useEffect, useRef, useState } from 'react'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface Props {
    activeDate: Date
    onSelect: (date: Date) => void
    onClose: () => void
}

export default function MonthYearPicker({ activeDate, onSelect, onClose }: Props) {
    const [year, setYear] = useState(activeDate.getFullYear())
    const ref = useRef<HTMLDivElement>(null)

    // Close on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose()
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [onClose])

    return (
        <div ref={ref}
            className="absolute left-0 top-full mt-2 z-50 fs-card rounded-2xl p-4 shadow-fs"
            style={{ minWidth: '220px' }}>

            {/* Year nav */}
            <div className="flex items-center justify-between mb-3">
                <button onClick={() => setYear((y) => y - 1)} className="fs-icon-btn" style={{ width: '24px', height: '24px', fontSize: '14px' }}>‹</button>
                <span className="text-sm font-semibold" style={{ color: 'var(--fs-text)' }}>{year}</span>
                <button onClick={() => setYear((y) => y + 1)} className="fs-icon-btn" style={{ width: '24px', height: '24px', fontSize: '14px' }}>›</button>
            </div>

            {/* Back to current month */}
            <button
                onClick={() => { onSelect(new Date()); onClose() }}
                className="w-full py-1.5 rounded-lg text-xs font-medium transition hover:opacity-80 mb-3"
                style={{ background: 'var(--fs-honey)', color: '#fff' }}>
                Today
            </button>

            {/* Month grid */}
            <div className="grid grid-cols-3 gap-1.5">
                {MONTHS.map((m, i) => {
                    const isActive = activeDate.getMonth() === i && activeDate.getFullYear() === year
                    return (
                        <button key={m}
                            onClick={() => { onSelect(new Date(year, i, 1)); onClose() }}
                            className="py-1.5 rounded-lg text-xs font-medium transition hover:opacity-80"
                            style={{
                                background: isActive ? 'var(--fs-honey)' : 'var(--fs-bg)',
                                color: isActive ? '#fff' : 'var(--fs-text)',
                                border: '0.5px solid var(--fs-border)',
                            }}>
                            {m}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}