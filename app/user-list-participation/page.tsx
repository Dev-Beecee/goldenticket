'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { UserProfileCard } from '@/components/userprofilecard/UserProfileCard'
import Image from 'next/image'

const fetcher = (url: string, inscriptionId: string) =>
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inscription_id: inscriptionId })
    }).then(res => res.json())

export default function UserListParticipation() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const inscriptionId = searchParams.get('inscriptionId')
    const { toast } = useToast()
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!inscriptionId) return

        const fetchData = async () => {
            try {
                setLoading(true)
                const response = await fetcher(
                    'https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/get-user-participations',
                    inscriptionId
                )
                setData(response)
            } catch (error: any) {
                toast({
                    title: 'Erreur',
                    description: error.message,
                    variant: 'destructive'
                })
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [inscriptionId, toast])

    if (loading) return <div className="text-center py-8">Chargement...</div>
    if (!data) return <div className="text-center py-8">Aucune donnée disponible</div>

    const formattedName = `${data.user.prenom} ${data.user.nom.charAt(0)}.`
    const participationCount = data.user.participationsCount
    const participationText =
        participationCount === 1
            ? '1 participation enregistrée'
            : `${participationCount} participations enregistrées`

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                {/* En-tête avec titre à gauche et bouton à droite */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-[#FF5400] mb-2">
                            {formattedName}
                        </h1>
                        <p className="text-lg text-[#FF5400]">{participationText}</p>
                    </div>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 px-4 py-2 bg-[#FF5400] text-white rounded-lg hover:bg-[#E04B00] transition-colors"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                                clipRule="evenodd"
                            />
                        </svg>
                        Retour
                    </button>
                </div>

                <h2 className="text-2xl font-extrabold text-center text-[#FF5400] uppercase mb-6">
                    Liste de mes participations
                </h2>

                {data.participations?.length > 0 ? (
                    <div className="space-y-6">
                        {data.participations.map((p: any) => (
                            <div key={p.id} className="p-4 border border-[#FFB700] bg-white rounded-lg hover:bg-gray-50">
                                <div className="">
                                    <div>
                                        <span>Restaurant détecté:</span>
                                        <h3 className="font-bold text-lg ">
                                            {p.restaurant?.nom || p.ocr_restaurant}
                                        </h3>
                                        <div className="flex flex-col gap-2 mt-6">
                                            <span>Date d'achat:</span>
                                            <div className="flex items-center gap-2">
                                            <span>
                                                {new Date(p.ocr_date_achat).toLocaleDateString('fr-FR', {
                                                    day: '2-digit',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                            <span> à</span>
                                            <span>
                                                {p.ocr_heure_achat}
                                            </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 mt-6">
                                        <span>Montant:</span>
                                        <span className="text-lg font-bold ">
                                            {p.ocr_montant} €
                                        </span>
                                    </div>
                                </div>

                                {/* Section résultat du tirage */}
                                <div className={`mt-4 p-3 rounded-lg ${p.has_won ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                                    <div className="flex items-center gap-3">
                                        {p.has_won ? (
                                            <>
                                                <div className="flex-shrink-0">
                                                    {p.lot?.photo_url && (
                                                        <Image
                                                            src={p.lot.photo_url}
                                                            alt={p.lot.titre}
                                                            width={60}
                                                            height={60}
                                                            className="rounded-md object-cover"
                                                        />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-green-700">Félicitations ! Vous avez gagné</p>
                                                    <p className="text-green-600">{p.lot?.titre}</p>
                                                    <p className="text-xs text-green-500">
                                                        Attribué le {new Date(p.date_attribution).toLocaleDateString('fr-FR')}
                                                    </p>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="w-full text-center">
                                                <p className="font-medium text-gray-600">Participation non gagnante</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-8">
                        Aucune participation enregistrée
                    </p>
                )}
            </div>
        </div>
    )
}