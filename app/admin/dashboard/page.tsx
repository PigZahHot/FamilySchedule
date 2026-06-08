'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FamilyMember } from '@/app/types/calendar'
import { QRCodeSVG } from 'qrcode.react'

type ShiftConfig = { anchor_date: string; anchor_shift_type: 'Day' | 'Night' }
type ShiftException = { id: number; override_date: string; override_type: string; custom_title: string | null }
type Section = 'members' | 'shift' | 'exceptions' | 'yearly' | 'qr'

const inputStyle = { border: '0.5px solid var(--fs-border)', background: 'var(--fs-bg)', color: 'var(--fs-text)' }

export default function AdminDashboard() {
    const router = useRouter()
    const [activeSection, setActiveSection] = useState<Section>('members')
    const [members, setMembers] = useState<FamilyMember[]>([])
    const [newMemberName, setNewMemberName] = useState('')
    const [newMemberColor, setNewMemberColor] = useState('#3b82f6')
    const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)
    const [memberSaving, setMemberSaving] = useState(false)
    const [shiftConfig, setShiftConfig] = useState<ShiftConfig | null>(null)
    const [anchorDate, setAnchorDate] = useState('')
    const [anchorType, setAnchorType] = useState<'Day' | 'Night'>('Day')
    const [shiftSaving, setShiftSaving] = useState(false)
    const [exceptions, setExceptions] = useState<ShiftException[]>([])
    const [exDate, setExDate] = useState('')
    const [exType, setExType] = useState('Work')
    const [exTitle, setExTitle] = useState('')
    const [exSaving, setExSaving] = useState(false)
    const [qrToken, setQrToken] = useState<string | null>(null)
    const [qrExpiry, setQrExpiry] = useState<Date | null>(null)
    const [qrSecondsLeft, setQrSecondsLeft] = useState(0)
    const [qrGenerating, setQrGenerating] = useState(false)
    const [yearlyEvents, setYearlyEvents] = useState<{ id: number; title: string; month: number; day: number }[]>([])
    const [yeTitle, setYeTitle] = useState('')
    const [yeMonth, setYeMonth] = useState(1)
    const [yeDay, setYeDay] = useState(1)
    const [yeSaving, setYeSaving] = useState(false)

    useEffect(() => { fetch('/api/auth/admin/check').then((res) => { if (!res.ok) router.replace('/admin') }) }, [])
    useEffect(() => { fetchMembers() }, [])
    useEffect(() => { if (activeSection === 'shift') fetchShiftConfig() }, [activeSection])
    useEffect(() => { if (activeSection === 'exceptions') fetchExceptions() }, [activeSection])

    useEffect(() => {
        if (!qrExpiry) return
        const interval = setInterval(() => {
            const secondsLeft = Math.max(0, Math.floor((qrExpiry.getTime() - Date.now()) / 1000))
            setQrSecondsLeft(secondsLeft)
            if (secondsLeft === 0) { setQrToken(null); setQrExpiry(null); clearInterval(interval) }
        }, 1000)
        return () => clearInterval(interval)
    }, [qrExpiry])

    async function fetchMembers() { const res = await fetch('/api/admin/members'); setMembers(await res.json()) }
    async function fetchShiftConfig() {
        const res = await fetch('/api/admin/shift-config'); const data = await res.json()
        if (data) { setShiftConfig(data); setAnchorDate(data.anchor_date.slice(0, 10)); setAnchorType(data.anchor_shift_type) }
    }
    async function fetchExceptions() { const res = await fetch('/api/admin/shift-exceptions'); setExceptions(await res.json()) }

    async function handleAddMember() {
        if (!newMemberName.trim()) return; setMemberSaving(true)
        await fetch('/api/admin/members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newMemberName, theme_color: newMemberColor }) })
        setNewMemberName(''); setNewMemberColor('#3b82f6'); await fetchMembers(); setMemberSaving(false)
    }
    async function handleDeleteMember(id: number) {
        if (!confirm('Delete this member? Their appointments will remain.')) return
        await fetch('/api/admin/members', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
        await fetchMembers()
    }
    async function handleEditMember() {
        if (!editingMember) return; setMemberSaving(true)
        await fetch('/api/admin/members', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingMember) })
        setEditingMember(null); await fetchMembers(); setMemberSaving(false)
    }
    async function handleSaveShift() {
        setShiftSaving(true)
        await fetch('/api/admin/shift-config', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ anchor_date: anchorDate, anchor_shift_type: anchorType }) })
        await fetchShiftConfig(); setShiftSaving(false)
    }
    async function handleAddException() {
        if (!exDate) return; setExSaving(true)
        await fetch('/api/admin/shift-exceptions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ override_date: exDate, override_type: exType, custom_title: exTitle || null }) })
        setExDate(''); setExTitle(''); await fetchExceptions(); setExSaving(false)
    }
    async function handleDeleteException(id: number) {
        await fetch('/api/admin/shift-exceptions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
        await fetchExceptions()
    }
    async function fetchYearlyEvents() {
        const res = await fetch('/api/admin/yearly-events')
        setYearlyEvents(await res.json())
    }
    useEffect(() => { if (activeSection === 'yearly') fetchYearlyEvents() }, [activeSection])
    async function handleAddYearlyEvent() {
        if (!yeTitle.trim()) return
        
        let maxDays = 31
        if (yeMonth === 2) maxDays = 29
        else if ([4, 6, 9, 11].includes(yeMonth)) maxDays = 30
        
        if (yeDay < 1 || yeDay > maxDays) {
            alert('Invalid day for the selected month.')
            return
        }

        setYeSaving(true)
        await fetch('/api/admin/yearly-events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: yeTitle, month: yeMonth, day: yeDay }),
        })
        setYeTitle('')
        await fetchYearlyEvents()
        setYeSaving(false)
    }
    async function handleDeleteYearlyEvent(id: number) {
        await fetch('/api/admin/yearly-events', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        })
        await fetchYearlyEvents()
    }
    async function handleGenerateQR() {
        setQrGenerating(true)
        const res = await fetch('/api/admin/qr/generate', { method: 'POST' }); const data = await res.json()
        setQrToken(`${window.location.origin}/api/auth/accept-bridge?token=${data.token}`)
        setQrExpiry(new Date(data.expiresAt)); setQrSecondsLeft(120); setQrGenerating(false)
    }
    async function handleLogout() { await fetch('/api/auth/admin/logout', { method: 'POST' }); router.push('/admin') }

    const navItems: { key: Section; label: string }[] = [
        { key: 'members', label: 'Members' }, { key: 'shift', label: 'Shift' },
        { key: 'exceptions', label: 'Exceptions' }, { key: 'yearly', label: 'Yearly' },
        { key: 'qr', label: 'QR Login' },
    ]

    return (
        <div className="fs-page min-h-screen">
            {/* Header */}
            <div className="fs-topbar px-4 py-4">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-base font-semibold" style={{ color: 'var(--fs-honey-dark)' }}>
                            Family<span style={{ color: 'var(--fs-honey)' }}> </span>Schedule
                        </h1>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--fs-text-muted)' }}>Admin Panel</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => router.push('/')}
                            className="text-xs px-3 py-1.5 rounded-lg transition hover:opacity-80"
                            style={{ color: 'var(--fs-text-muted)', background: 'var(--fs-surface)', border: '0.5px solid var(--fs-border)' }}>
                            ← Calendar
                        </button>
                        <button onClick={handleLogout}
                            className="text-xs px-3 py-1.5 rounded-lg transition hover:opacity-80"
                            style={{ color: '#ef4444', background: '#fef2f2', border: '0.5px solid #fecaca' }}>
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6">
                {/* Nav tabs */}
                <div className="fs-tab-bar rounded-xl p-1 flex gap-1 mb-6">
                    {navItems.map((item) => (
                        <button key={item.key} onClick={() => setActiveSection(item.key)}
                            className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${activeSection === item.key ? 'fs-tab active' : 'fs-tab'}`}>
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* Members */}
                {activeSection === 'members' && (
                    <div className="space-y-4">
                        <div className="fs-card rounded-2xl overflow-hidden">
                            {members.length === 0 ? (
                                <p className="text-sm text-center py-8" style={{ color: 'var(--fs-text-faint)' }}>No members yet</p>
                            ) : members.map((m) => (
                                <div key={m.id} className="flex items-center gap-3 px-4 py-3 border-b last:border-0"
                                    style={{ borderColor: 'var(--fs-border-light)' }}>
                                    {editingMember?.id === m.id ? (
                                        <>
                                            <input type="color" value={editingMember.theme_color}
                                                onChange={(e) => setEditingMember({ ...editingMember, theme_color: e.target.value })}
                                                className="w-7 h-7 rounded-lg border-0 cursor-pointer" />
                                            <input type="text" value={editingMember.name}
                                                onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                                                className="flex-1 rounded-lg px-2 py-1 text-sm focus:outline-none" style={inputStyle} />
                                            <button onClick={handleEditMember} disabled={memberSaving}
                                                className="text-xs font-medium transition hover:opacity-70" style={{ color: 'var(--fs-honey-dark)' }}>
                                                {memberSaving ? 'Saving...' : 'Save'}
                                            </button>
                                            <button onClick={() => setEditingMember(null)}
                                                className="text-xs transition hover:opacity-70" style={{ color: 'var(--fs-text-muted)' }}>Cancel</button>
                                        </>
                                    ) : (
                                        <>
                                            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: m.theme_color }} />
                                            <span className="flex-1 text-sm font-medium" style={{ color: 'var(--fs-text)' }}>{m.name}</span>
                                            <button onClick={() => setEditingMember(m)} className="text-xs transition hover:opacity-70"
                                                style={{ color: 'var(--fs-text-muted)' }}>Edit</button>
                                            <button onClick={() => handleDeleteMember(m.id!)} className="text-xs transition hover:opacity-70"
                                                style={{ color: '#ef4444' }}>Delete</button>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="fs-card rounded-2xl p-4">
                            <p className="fs-section-label mb-3">Add Member</p>
                            <div className="flex gap-2 items-center">
                                <input type="color" value={newMemberColor} onChange={(e) => setNewMemberColor(e.target.value)}
                                    className="w-9 h-9 rounded-xl border-0 cursor-pointer flex-shrink-0" />
                                <input type="text" placeholder="Name" value={newMemberName}
                                    onChange={(e) => setNewMemberName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                                    className="flex-1 rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle} />
                                <button onClick={handleAddMember} disabled={memberSaving || !newMemberName.trim()}
                                    className="px-4 py-2 rounded-xl text-xs font-medium transition disabled:opacity-40"
                                    style={{ background: 'var(--fs-honey)', color: '#fff' }}>Add</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Shift config */}
                {activeSection === 'shift' && (
                    <div className="fs-card rounded-2xl p-5">
                        <p className="fs-section-label mb-4">4-On-2-Off Anchor</p>
                        <div className="space-y-3 mb-5">
                            <div>
                                <label className="fs-section-label mb-1 block">Anchor Date</label>
                                <input type="date" value={anchorDate} onChange={(e) => setAnchorDate(e.target.value)}
                                    className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none" style={inputStyle} />
                            </div>
                            <div>
                                <label className="fs-section-label mb-1 block">Anchor Shift Type</label>
                                <select value={anchorType} onChange={(e) => setAnchorType(e.target.value as 'Day' | 'Night')}
                                    className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none" style={inputStyle}>
                                    <option value="Day">Day</option>
                                    <option value="Night">Night</option>
                                </select>
                            </div>
                        </div>
                        <button onClick={handleSaveShift} disabled={shiftSaving}
                            className="w-full py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-40"
                            style={{ background: 'var(--fs-honey)', color: '#fff' }}>
                            {shiftSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                )}

                {/* Exceptions */}
                {activeSection === 'exceptions' && (
                    <div className="space-y-4">
                        <div className="fs-card rounded-2xl p-4">
                            <p className="fs-section-label mb-3">Add Override</p>
                            <div className="space-y-2">
                                <input type="date" value={exDate} onChange={(e) => setExDate(e.target.value)}
                                    className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle} />
                                <select value={exType} onChange={(e) => setExType(e.target.value)}
                                    className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}>
                                    <option value="Work">Work</option>
                                    <option value="Break">Break</option>
                                    <option value="Off">Off</option>
                                </select>
                                <input type="text" placeholder="Custom label (optional)" value={exTitle}
                                    onChange={(e) => setExTitle(e.target.value)}
                                    className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle} />
                                <button onClick={handleAddException} disabled={exSaving || !exDate}
                                    className="w-full py-2 rounded-xl text-xs font-medium transition disabled:opacity-40"
                                    style={{ background: 'var(--fs-honey)', color: '#fff' }}>
                                    {exSaving ? 'Saving...' : 'Add Override'}
                                </button>
                            </div>
                        </div>
                        <div className="fs-card rounded-2xl overflow-hidden">
                            {exceptions.length === 0 ? (
                                <p className="text-sm text-center py-8" style={{ color: 'var(--fs-text-faint)' }}>No overrides yet</p>
                            ) : exceptions.map((ex) => (
                                <div key={ex.id} className="flex items-center gap-3 px-4 py-3 border-b last:border-0"
                                    style={{ borderColor: 'var(--fs-border-light)' }}>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium" style={{ color: 'var(--fs-text)' }}>{ex.override_date.slice(0, 10)}</p>
                                        <p className="text-xs" style={{ color: 'var(--fs-text-muted)' }}>
                                            {ex.override_type}{ex.custom_title ? ` — ${ex.custom_title}` : ''}
                                        </p>
                                    </div>
                                    <button onClick={() => handleDeleteException(ex.id)}
                                        className="text-xs transition hover:opacity-70" style={{ color: '#ef4444' }}>Delete</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Yearly Events */}
                {activeSection === 'yearly' && (
                    <div className="space-y-4">
                        <div className="fs-card rounded-2xl p-4">
                            <p className="fs-section-label mb-3">Add Yearly Event</p>
                            <div className="space-y-2">
                                <input type="text" placeholder="Title (e.g. Carl's Birthday)"
                                    value={yeTitle} onChange={(e) => setYeTitle(e.target.value)}
                                    className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle} />
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="fs-section-label mb-1 block">Month</label>
                                        <select value={yeMonth} onChange={(e) => setYeMonth(Number(e.target.value))}
                                            className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle}>
                                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                                                <option key={m} value={i + 1}>{m}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <label className="fs-section-label mb-1 block">Day</label>
                                        <input type="number" min={1} max={yeMonth === 2 ? 29 : [4, 6, 9, 11].includes(yeMonth) ? 30 : 31} value={yeDay}
                                            onChange={(e) => setYeDay(Number(e.target.value))}
                                            className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none" style={inputStyle} />
                                    </div>
                                </div>
                                <button onClick={handleAddYearlyEvent} disabled={yeSaving || !yeTitle.trim()}
                                    className="w-full py-2 rounded-xl text-xs font-medium transition disabled:opacity-40"
                                    style={{ background: 'var(--fs-honey)', color: '#fff' }}>
                                    {yeSaving ? 'Saving...' : 'Add Event'}
                                </button>
                            </div>
                        </div>

                        <div className="fs-card rounded-2xl overflow-hidden">
                            {yearlyEvents.length === 0 ? (
                                <p className="text-sm text-center py-8" style={{ color: 'var(--fs-text-faint)' }}>No yearly events yet</p>
                            ) : yearlyEvents.map((ev) => (
                                <div key={ev.id} className="flex items-center gap-3 px-4 py-3 border-b last:border-0"
                                    style={{ borderColor: 'var(--fs-border-light)' }}>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium" style={{ color: 'var(--fs-text)' }}>{ev.title}</p>
                                        <p className="text-xs" style={{ color: 'var(--fs-text-muted)' }}>
                                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][ev.month - 1]} {ev.day}
                                        </p>
                                    </div>
                                    <button onClick={() => handleDeleteYearlyEvent(ev.id)}
                                        className="text-xs transition hover:opacity-70" style={{ color: '#ef4444' }}>Delete</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* QR Login */}
                {activeSection === 'qr' && (
                    <div className="fs-card rounded-2xl p-5">
                        <p className="fs-section-label mb-1">Authorize New Device</p>
                        <p className="text-xs mb-5" style={{ color: 'var(--fs-text-muted)' }}>
                            Generate a one-time QR code. Scan it on a new phone to log in without the passphrase. Valid for 2 minutes.
                        </p>
                        {qrToken ? (
                            <div className="flex flex-col items-center gap-4">
                                <div className="p-3 rounded-2xl" style={{ background: 'var(--fs-surface)', border: '0.5px solid var(--fs-border)' }}>
                                    <QRCodeSVG value={qrToken} size={200} />
                                </div>
                                <div className="text-sm font-medium" style={{ color: qrSecondsLeft <= 30 ? '#ef4444' : 'var(--fs-text-muted)' }}>
                                    Expires in {qrSecondsLeft}s
                                </div>
                                <button onClick={() => { setQrToken(null); setQrExpiry(null) }}
                                    className="text-xs transition hover:opacity-70" style={{ color: 'var(--fs-text-muted)' }}>Cancel</button>
                            </div>
                        ) : (
                            <button onClick={handleGenerateQR} disabled={qrGenerating}
                                className="w-full py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-40"
                                style={{ background: 'var(--fs-honey)', color: '#fff' }}>
                                {qrGenerating ? 'Generating...' : 'Generate QR Code'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}