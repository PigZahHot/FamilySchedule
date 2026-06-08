'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
    const [pin, setPin] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit() {
        if (!pin.trim()) return
        setLoading(true); setError('')
        const res = await fetch('/api/auth/admin', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin }),
        })
        if (res.ok) { router.push('/admin/dashboard') }
        else { const data = await res.json(); setError(data.message || 'Incorrect PIN.') }
        setLoading(false)
    }

    return (
        <main className="fs-page min-h-screen flex items-center justify-center">
            <div className="fs-card rounded-2xl p-8 w-full max-w-sm mx-4">
                <h1 className="text-base font-semibold mb-1" style={{ color: 'var(--fs-honey-dark)' }}>
                    Family<span style={{ color: 'var(--fs-honey)' }}> </span>Schedule
                </h1>
                <p className="text-xs mb-6" style={{ color: 'var(--fs-text-muted)' }}>Admin — enter your PIN to continue.</p>
                <input type="password" inputMode="numeric" placeholder="PIN" value={pin}
                    onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    className="w-full rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none"
                    style={{ border: '0.5px solid var(--fs-border)', background: 'var(--fs-bg)', color: 'var(--fs-text)' }}
                />
                {error && <p className="text-xs mb-3" style={{ color: '#ef4444' }}>{error}</p>}
                <button onClick={handleSubmit} disabled={loading}
                    className="w-full py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50"
                    style={{ background: 'var(--fs-honey)', color: '#fff' }}>
                    {loading ? 'Checking...' : 'Enter'}
                </button>
            </div>
        </main>
    )
}