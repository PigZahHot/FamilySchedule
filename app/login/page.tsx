'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const [passphrase, setPassphrase] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit() {
        setLoading(true)
        setError('')

        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ passphrase }),
        })

        if (res.ok) {
            router.push('/')
        } else {
            const data = await res.json()
            setError(data.message || 'Incorrect passphrase.')
        }

        setLoading(false)
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
                <h1 className="text-2xl font-semibold text-gray-800 mb-2">Family Schedule</h1>
                <p className="text-gray-500 text-sm mb-6">Enter the family passphrase to continue.</p>

                <input
                    type="password"
                    placeholder="Passphrase"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />

                {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 rounded-lg transition disabled:opacity-50"
                >
                    {loading ? 'Checking...' : 'Enter'}
                </button>
            </div>
        </main>
    )
}