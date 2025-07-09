'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { UserProfileCard } from '@/components/userprofilecard/UserProfileCard'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from '@/components/ui/dialog'

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
    const [openDialog, setOpenDialog] = useState(false)

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
                        <h1 className="text-3xl font-bold  mb-2">
                            {formattedName}
                        </h1>
                        <p className="text-lg ">{participationText}</p>
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

                <h2 className="text-2xl font-extrabold text-center  uppercase mb-6">
                    Liste de mes participations
                </h2>

                {data.participations?.length > 0 ? (
                    <div className="space-y-6">
                        {data.participations.map((p: any) => (
                            <div key={p.id} className="p-4 border rounded-lg hover:bg-gray-50 card">
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
                                <div className={`mt-4 p-3 rounded-lg ${p.has_won ? '' : 'bg-gray-50 border border-gray-200'}`}>
                                    <div className=" items-center gap-3">
                                        {p.has_won ? (
                                            <>
                                            <div> <p className="font-bold  text-center text-2xl">Tu as gagné !</p></div>
                                                <div className="flex-shrink-0">
                                                    {p.lot?.photo_url && (
                                                        <Image
                                                            src={p.lot.photo_url}
                                                            alt={p.lot.titre}
                                                            width={120}
                                                            height={120}
                                                            className="rounded-md object-cover mx-auto"
                                                        />
                                                    )}
                                                </div>
                                                <div>
                                                   
                                                    <p className=" text-center">{p.lot?.titre}</p>
                                                    
                                                </div>
    <div className="mt-4">
      <Dialog>
        <DialogTrigger asChild>
          <Button className="w-full">
            Comment récupérer mon gain ?
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Récupération de votre gain</DialogTitle>
            <DialogDescription asChild>
              <div>
                {p.lot?.instructions
                  ? <span dangerouslySetInnerHTML={{ __html: p.lot.instructions }} />
                  : (
                    <>
                      Félicitations pour votre gain ! Pour récupérer votre lot, veuillez suivre les instructions envoyées à votre adresse e-mail enregistrée.<br />
                      Si vous n'avez pas reçu d'e-mail, veuillez contacter notre support client.
                    </>
                  )
                }
              </div>
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => document.activeElement && (document.activeElement as HTMLElement).blur()}>
            Fermer
          </Button>
        </DialogContent>
      </Dialog>
    </div>
                                            </>
                                        ) : (
                                            <div className="w-full text-center">
                                                <p className="font-medium text-gray-600 text-2xl">Tu as perdu !</p>
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