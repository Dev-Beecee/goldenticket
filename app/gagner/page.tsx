'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { RegistrationHeader } from '@/components/registration/RegistrationHeader'
import ShareButton from '@/components/ShareButton'
import { useRouter } from 'next/navigation'

export default function GagnerPage() {
    const searchParams = useSearchParams()
    const [lot, setLot] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Déclare inscriptionId ici
    const inscriptionId = searchParams.get('id') || (typeof window !== 'undefined' ? localStorage.getItem('inscription_id') : null)

    useEffect(() => {
        if (!inscriptionId) {
            setError('Aucun identifiant d’inscription fourni.')
            setLoading(false)
            return
        }

        const fetchLot = async () => {
            try {
                setLoading(true)
                setError(null)

                const res = await fetch('https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/recuperer-lot', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ inscription_id: inscriptionId })
                })

                const data = await res.json()
                if (res.ok && data.lot) {
                    setLot(data.lot)
                } else {
                    setError(data.error || "Aucun lot trouvé pour cet utilisateur.")
                }
            } catch (e) {
                setError("Erreur lors de la récupération du lot.")
            } finally {
                setLoading(false)
            }
        }

        fetchLot()
    }, [searchParams])

    const router = useRouter()

  return (
        <main className="min-h-screen flex flex-col items-center justify-center ">
            <RegistrationHeader />
            <div className="w-full max-w-xs text-center border border-white rounded-lg">
                <h1 className="text-2xl font-bold mb-4 text-white">Félicitations, tu as gagné !</h1>
                {loading ? (
                    <p className="text-white mb-4">Chargement de votre lot...</p>
                ) : error ? (
                    <p className="text-red-600 mb-4">{error}</p>
                ) : lot ? (
                    <>
                        <p className="text-white mb-4">
                        Tu remportes :
                        </p>
                        {lot.photo_url && (
                            <img
                                src={lot.photo_url}
                                alt={lot.titre}
                                className="mx-auto rounded shadow-md w-48 h-48 object-cover mb-4"
                            />
                        )}
                        <h2 className="text-lg font-semibold text-green-800 mb-2">{lot.titre}</h2>
                        {lot.instructions && (
                            <div
                                className="text-sm text-green-900 bg-green-100 rounded p-2 mb-2"
                                dangerouslySetInnerHTML={{ __html: lot.instructions }}
                            />
                        )}
                        <p className="text-white text-center mt-4">
                          Un e-mail vient de t’être envoyé avec toutes les instructions pour récupérer ton lot.
                        </p>
                        <p className="text-white text-center mt-4">
                          Pense à vérifier tes spams si tu ne le vois pas dans ta boîte de réception !
                        </p>
                        <div className="flex flex-col gap-4 mt-6">
                    <button
                        className="font-bold py-2 px-4"
                        style={{ color: '#8A2E92', border: '1px solid white', borderRadius: 40, background: '#FFBC0D' }}
                        onClick={() => router.push('/')}
                    >
                        Je tente encore ma chance
                    </button>
                    <ShareButton inscriptionId="demo" canal="autre" shareUrl={typeof window !== 'undefined' ? window.location.origin + '/' : ''}>
                    Partager ce jeu À mes amis !
                    </ShareButton>
                </div>
                    </>
                ) : null}
            </div>
    </main>
    )
} 