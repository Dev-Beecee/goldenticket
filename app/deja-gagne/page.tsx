'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function DejaGagnePage() {
    const searchParams = useSearchParams()
    const [lot, setLot] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const participationId = searchParams.get('id')
        if (!participationId) {
            setError('Aucun identifiant de participation fourni.')
            setLoading(false)
            return
        }
        const fetchLot = async () => {
            try {
                setLoading(true)
                setError(null)
                const res = await fetch('https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/attribuer-lot-force-gain', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ participation_id: participationId })
                })
                const data = await res.json()
                if (data.result === 'Déjà joué' && data.gain && data.lot) {
                    setLot(data.lot)
                } else {
                    setError("Aucun lot trouvé pour cette participation.")
                }
            } catch (e) {
                setError("Erreur lors de la récupération du lot.")
            } finally {
                setLoading(false)
            }
        }
        fetchLot()
    }, [searchParams])

    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-green-50 p-6">
            <div className="w-full max-w-xs text-center">
                <h1 className="text-2xl font-bold mb-4 text-green-700">Bravo !</h1>
                {loading ? (
                    <p className="text-gray-700 mb-4">Chargement de votre lot.....</p>
                ) : error ? (
                    <p className="text-red-600 mb-4">{error}</p>
                ) : lot ? (
                    <>
                        <p className="text-gray-700 mb-4">
                            Vous avez déjà gagné avec ce ticket.<br />
                            Consultez vos instructions dans votre email !
                        </p>
                        {lot.image && (
                            <img src={lot.image} alt={lot.titre} className="mx-auto rounded shadow-md w-48 h-48 object-cover mb-4" />
                        )}
                        <h2 className="text-lg font-semibold text-green-800 mb-2">{lot.titre}</h2>
                        {lot.instructions && (
                            <div className="text-sm text-green-900 bg-green-100 rounded p-2 mb-2" dangerouslySetInnerHTML={{ __html: lot.instructions }} />
                        )}
                    </>
                ) : null}
            </div>
        </main>
    )
} 