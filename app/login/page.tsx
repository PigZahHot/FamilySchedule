'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const [passphrase, setPassphrase] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit() {
        setLoading(true); setError('')
        const res = await fetch('/api/auth/login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ passphrase }),
        })
        if (res.ok) { router.push('/') }
        else { const data = await res.json(); setError(data.message || 'Incorrect passphrase.') }
        setLoading(false)
    }

    return (
        <main className="fs-page min-h-screen flex items-center justify-center">
            <div className="fs-card rounded-2xl p-8 w-full max-w-sm mx-4">
                <h1 className="text-lg font-semibold mb-1" style={{ color: 'var(--fs-honey-dark)' }}>
                    family<span style={{ color: 'var(--fs-honey)' }}>.</span>schedule
                </h1>
                <p className="text-xs mb-6" style={{ color: 'var(--fs-text-muted)' }}>Enter the family passphrase to continue.</p>
                <input type="password" placeholder="Passphrase" value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
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