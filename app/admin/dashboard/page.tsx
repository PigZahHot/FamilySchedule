'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FamilyMember } from '@/app/types/calendar'
import { QRCodeSVG } from 'qrcode.react'

type ShiftConfig = {
    anchor_date: string
    anchor_shift_type: 'Day' | 'Night'
}

type ShiftException = {
    id: number
    override_date: string
    override_type: string
    custom_title: string | null
}

type Section = 'members' | 'shift' | 'exceptions' | 'qr'

export default function AdminDashboard() {
    const router = useRouter()
    const [activeSection, setActiveSection] = useState<Section>('members')

    // Members state
    const [members, setMembers] = useState<FamilyMember[]>([])
    const [newMemberName, setNewMemberName] = useState('')
    const [newMemberColor, setNewMemberColor] = useState('#3b82f6')
    const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)
    const [memberSaving, setMemberSaving] = useState(false)

    // Shift config state
    const [shiftConfig, setShiftConfig] = useState<ShiftConfig | null>(null)
    const [anchorDate, setAnchorDate] = useState('')
    const [anchorType, setAnchorType] = useState<'Day' | 'Night'>('Day')
    const [shiftSaving, setShiftSaving] = useState(false)

    // Shift exceptions state
    const [exceptions, setExceptions] = useState<ShiftException[]>([])
    const [exDate, setExDate] = useState('')
    const [exType, setExType] = useState('Work')
    const [exTitle, setExTitle] = useState('')
    const [exSaving, setExSaving] = useState(false)

    // QR state
    const [qrToken, setQrToken] = useState<string | null>(null)
    const [qrExpiry, setQrExpiry] = useState<Date | null>(null)
    const [qrSecondsLeft, setQrSecondsLeft] = useState(0)
    const [qrGenerating, setQrGenerating] = useState(false)

    useEffect(() => {
        fetch('/api/auth/admin/check').then((res) => {
            if (!res.ok) router.replace('/admin')
        })
    }, [])

    useEffect(() => { fetchMembers() }, [])
    useEffect(() => { if (activeSection === 'shift') fetchShiftConfig() }, [activeSection])
    useEffect(() => { if (activeSection === 'exceptions') fetchExceptions() }, [activeSection])

    async function handleGenerateQR() {
        setQrGenerating(true)
        const res = await fetch('/api/admin/qr/generate', { method: 'POST' })
        const data = await res.json()
        const baseUrl = window.location.origin
        setQrToken(`${baseUrl}/api/auth/accept-bridge?token=${data.token}`)
        setQrExpiry(new Date(data.expiresAt))
        setQrSecondsLeft(120)
        setQrGenerating(false)
    }

    useEffect(() => {
        if (!qrExpiry) return
        const interval = setInterval(() => {
            const secondsLeft = Math.max(0, Math.floor((qrExpiry.getTime() - Date.now()) / 1000))
            setQrSecondsLeft(secondsLeft)
            if (secondsLeft === 0) {
                setQrToken(null)
                setQrExpiry(null)
                clearInterval(interval)
            }
        }, 1000)
        return () => clearInterval(interval)
    }, [qrExpiry])

    async function fetchMembers() {
        const res = await fetch('/api/admin/members')
        setMembers(await res.json())
    }

    async function fetchShiftConfig() {
        const res = await fetch('/api/admin/shift-config')
        const data = await res.json()
        if (data) {
            setShiftConfig(data)
            setAnchorDate(data.anchor_date.slice(0, 10))
            setAnchorType(data.anchor_shift_type)
        }
    }

    async function fetchExceptions() {
        const res = await fetch('/api/admin/shift-exceptions')
        setExceptions(await res.json())
    }

    async function handleAddMember() {
        if (!newMemberName.trim()) return
        setMemberSaving(true)
        await fetch('/api/admin/members', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newMemberName, theme_color: newMemberColor }),
        })
        setNewMemberName('')
        setNewMemberColor('#3b82f6')
        await fetchMembers()
        setMemberSaving(false)
    }

    async function handleDeleteMember(id: number) {
        if (!confirm('Delete this member? Their appointments will remain.')) return
        await fetch('/api/admin/members', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        })
        await fetchMembers()
    }

    async function handleEditMember() {
        if (!editingMember) return
        setMemberSaving(true)
        await fetch('/api/admin/members', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editingMember),
        })
        setEditingMember(null)
        await fetchMembers()
        setMemberSaving(false)
    }

    async function handleSaveShift() {
        setShiftSaving(true)
        await fetch('/api/admin/shift-config', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ anchor_date: anchorDate, anchor_shift_type: anchorType }),
        })
        await fetchShiftConfig()
        setShiftSaving(false)
    }

    async function handleAddException() {
        if (!exDate) return
        setExSaving(true)
        await fetch('/api/admin/shift-exceptions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ override_date: exDate, override_type: exType, custom_title: exTitle || null }),
        })
        setExDate('')
        setExTitle('')
        await fetchExceptions()
        setExSaving(false)
    }

    async function handleDeleteException(id: number) {
        await fetch('/api/admin/shift-exceptions', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        })
        await fetchExceptions()
    }

    async function handleLogout() {
        await fetch('/api/auth/admin/logout', { method: 'POST' })
        router.push('/admin')
    }

    const navItems: { key: Section; label: string }[] = [
        { key: 'members', label: 'Family Members' },
        { key: 'shift', label: 'Shift Config' },
        { key: 'exceptions', label: 'Exceptions' },
        { key: 'qr', label: 'QR Login' },
    ]

    return (
        <div className="min-h-screen bg-stone-50">
            {/* Header */}
            <div className="bg-white border-b border-stone-100 px-4 py-4">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold text-stone-800">Admin Panel</h1>
                        <p className="text-stone-400 text-xs mt-0.5">Family Schedule</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => router.push('/')}
                            className="text-xs text-stone-400 hover:text-stone-600 transition px-3 py-1.5 rounded-lg hover:bg-stone-100"
                        >
                            ← Calendar
                        </button>
                        <button
                            onClick={handleLogout}
                            className="text-xs text-red-400 hover:text-red-600 transition px-3 py-1.5 rounded-lg hover:bg-red-50"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6">
                {/* Nav tabs */}
                <div className="flex gap-1 bg-white rounded-xl p-1 border border-stone-100 mb-6">
                    {navItems.map((item) => (
                        <button
                            key={item.key}
                            onClick={() => setActiveSection(item.key)}
                            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${activeSection === item.key
                                ? 'bg-stone-800 text-white'
                                : 'text-stone-400 hover:text-stone-600'
                                }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* — Members section — */}
                {activeSection === 'members' && (
                    <div className="space-y-4">
                        {/* Existing members */}
                        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
                            {members.length === 0 ? (
                                <p className="text-stone-300 text-sm text-center py-8">No members yet</p>
                            ) : (
                                members.map((m) => (
                                    <div key={m.id} className="flex items-center gap-3 px-4 py-3 border-b border-stone-50 last:border-0">
                                        {editingMember?.id === m.id ? (
                                            <>
                                                <input
                                                    type="color"
                                                    value={editingMember.theme_color}
                                                    onChange={(e) => setEditingMember({ ...editingMember, theme_color: e.target.value })}
                                                    className="w-7 h-7 rounded-lg border-0 cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={editingMember.name}
                                                    onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                                                    className="flex-1 border border-stone-200 rounded-lg px-2 py-1 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-300"
                                                />
                                                <button onClick={handleEditMember} disabled={memberSaving} className="text-xs text-stone-700 font-semibold hover:text-stone-900 transition">
                                                    {memberSaving ? 'Saving...' : 'Save'}
                                                </button>
                                                <button onClick={() => setEditingMember(null)} className="text-xs text-stone-400 hover:text-stone-600 transition">
                                                    Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: m.theme_color }} />
                                                <span className="flex-1 text-sm text-stone-700 font-medium">{m.name}</span>
                                                <button onClick={() => setEditingMember(m)} className="text-xs text-stone-400 hover:text-stone-600 transition">Edit</button>
                                                <button onClick={() => handleDeleteMember(m.id!)} className="text-xs text-red-400 hover:text-red-600 transition">Delete</button>
                                            </>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Add new member */}
                        <div className="bg-white rounded-2xl border border-stone-100 p-4">
                            <p className="text-xs font-semibold text-stone-500 mb-3">Add Member</p>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="color"
                                    value={newMemberColor}
                                    onChange={(e) => setNewMemberColor(e.target.value)}
                                    className="w-9 h-9 rounded-xl border-0 cursor-pointer flex-shrink-0"
                                />
                                <input
                                    type="text"
                                    placeholder="Name"
                                    value={newMemberName}
                                    onChange={(e) => setNewMemberName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                                    className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-300"
                                />
                                <button
                                    onClick={handleAddMember}
                                    disabled={memberSaving || !newMemberName.trim()}
                                    className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold rounded-xl transition disabled:opacity-40"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* — Shift config section — */}
                {activeSection === 'shift' && (
                    <div className="bg-white rounded-2xl border border-stone-100 p-5">
                        <p className="text-xs font-semibold text-stone-500 mb-4">4-On-2-Off Anchor</p>
                        <div className="space-y-3 mb-5">
                            <div>
                                <label className="text-xs font-medium text-stone-500 mb-1 block">Anchor Date</label>
                                <input
                                    type="date"
                                    value={anchorDate}
                                    onChange={(e) => setAnchorDate(e.target.value)}
                                    className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-300"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-stone-500 mb-1 block">Anchor Shift Type</label>
                                <select
                                    value={anchorType}
                                    onChange={(e) => setAnchorType(e.target.value as 'Day' | 'Night')}
                                    className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-300"
                                >
                                    <option value="Day">Day</option>
                                    <option value="Night">Night</option>
                                </select>
                            </div>
                        </div>
                        <button
                            onClick={handleSaveShift}
                            disabled={shiftSaving}
                            className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-white text-sm font-medium rounded-xl transition disabled:opacity-40"
                        >
                            {shiftSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                )}

                {/* — Shift exceptions section — */}
                {activeSection === 'exceptions' && (
                    <div className="space-y-4">
                        {/* Add exception */}
                        <div className="bg-white rounded-2xl border border-stone-100 p-4">
                            <p className="text-xs font-semibold text-stone-500 mb-3">Add Override</p>
                            <div className="space-y-2">
                                <input
                                    type="date"
                                    value={exDate}
                                    onChange={(e) => setExDate(e.target.value)}
                                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-300"
                                />
                                <select
                                    value={exType}
                                    onChange={(e) => setExType(e.target.value)}
                                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-300"
                                >
                                    <option value="Work">Work</option>
                                    <option value="Break">Break</option>
                                    <option value="Off">Off</option>
                                </select>
                                <input
                                    type="text"
                                    placeholder="Custom label (optional)"
                                    value={exTitle}
                                    onChange={(e) => setExTitle(e.target.value)}
                                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-300"
                                />
                                <button
                                    onClick={handleAddException}
                                    disabled={exSaving || !exDate}
                                    className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold rounded-xl transition disabled:opacity-40"
                                >
                                    {exSaving ? 'Saving...' : 'Add Override'}
                                </button>
                            </div>
                        </div>

                        {/* Existing exceptions */}
                        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
                            {exceptions.length === 0 ? (
                                <p className="text-stone-300 text-sm text-center py-8">No overrides yet</p>
                            ) : (
                                exceptions.map((ex) => (
                                    <div key={ex.id} className="flex items-center gap-3 px-4 py-3 border-b border-stone-50 last:border-0">
                                        <div className="flex-1">
                                            <p className="text-sm text-stone-700 font-medium">{ex.override_date.slice(0, 10)}</p>
                                            <p className="text-xs text-stone-400">{ex.override_type}{ex.custom_title ? ` — ${ex.custom_title}` : ''}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteException(ex.id)}
                                            className="text-xs text-red-400 hover:text-red-600 transition"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* — QR Login section — */}
                {activeSection === 'qr' && (
                    <div className="bg-white rounded-2xl border border-stone-100 p-5">
                        <p className="text-xs font-semibold text-stone-500 mb-1">Authorize New Device</p>
                        <p className="text-xs text-stone-400 mb-5">
                            Generate a one-time QR code. Scan it on a new phone to log in without the passphrase. Valid for 2 minutes.
                        </p>

                        {qrToken ? (
                            <div className="flex flex-col items-center gap-4">
                                <div className="p-3 bg-white border border-stone-200 rounded-2xl">
                                    <QRCodeSVG value={qrToken} size={200} />
                                </div>
                                <div className={`text-sm font-semibold ${qrSecondsLeft <= 30 ? 'text-red-500' : 'text-stone-500'}`}>
                                    Expires in {qrSecondsLeft}s
                                </div>
                                <button
                                    onClick={() => { setQrToken(null); setQrExpiry(null) }}
                                    className="text-xs text-stone-400 hover:text-stone-600 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleGenerateQR}
                                disabled={qrGenerating}
                                className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-white text-sm font-medium rounded-xl transition disabled:opacity-40"
                            >
                                {qrGenerating ? 'Generating...' : 'Generate QR Code'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}