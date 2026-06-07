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
        setLoading(true)
        setError('')

        const res = await fetch('/api/auth/admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin }),
        })

        if (res.ok) {
            router.push('/admin/dashboard')
        } else {
            const data = await res.json()
            setError(data.message || 'Incorrect PIN.')
        }

        setLoading(false)
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-stone-50">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 w-full max-w-sm mx-4">
                <h1 className="text-xl font-bold text-stone-800 mb-1">Admin Panel</h1>
                <p className="text-stone-400 text-sm mb-6">Enter your PIN to continue.</p>

                <input
                    type="password"
                    inputMode="numeric"
                    placeholder="PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-stone-300 text-stone-700"
                />

                {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-stone-800 hover:bg-stone-700 text-white text-sm font-medium py-2.5 rounded-xl transition disabled:opacity-50"
                >
                    {loading ? 'Checking...' : 'Enter'}
                </button>
            </div>
        </main>
    )
}