'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { supabase } from '@/lib/supabase-client'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const fetcher = (url: string, inscriptionId: string) =>
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inscription_id: inscriptionId })
    }).then(res => res.json())

export function UserProfileCard({ inscriptionId }: { inscriptionId: string }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const { toast } = useToast()

    const { data, error } = useSWR(
        ['https://nkymassyzvfwzrjekatr.supabase.co/functions/v1/get-user-participations', inscriptionId],
        ([url, id]) => fetcher(url, id),
        { refreshInterval: 5000 }
    )

    useEffect(() => {
        if (error) {
            toast({
                title: 'Erreur',
                description: error.message,
                variant: 'destructive'
            })
        }
    }, [error, toast])

    if (!data?.user || data.user.participationsCount === 0) return null

    const formattedName = `${data.user.prenom} ${data.user.nom.charAt(0)}.`
    const participationCount = data.user.participationsCount
    const participationText =
        participationCount === 1
            ? '1 participation enregistrée'
            : `${participationCount} participations enregistrées`

    return (
        <>
            <div className="w-full flex justify-center">
                <div
                    onClick={() => setIsDialogOpen(true)}
                    className="flex items-center justify-between bg-white rounded-2xl px-6 py-4 shadow cursor-pointer hover:shadow-md transition-shadow max-w-md w-full"
                >
                    <div className="basis-[90%]">
                        <h3 className="font-bold text-center text-orange-600">{formattedName}</h3>
                        <p className="text-sm text-center text-orange-600">{participationText}</p>
                    </div>
                    <div className="ml-4 text-black basis-[10%]">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="#FF5400"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-[3px] border-[#FFB700] bg-[#FF5400] text-white rounded-[20px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl text-center ">
                            {formattedName}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <p className="text-sm text-center text-white">{participationText}</p>
                        <p className="text-lg font-extrabold text-center text-white uppercase">
                            Liste de mes participations
                        </p>
                        {data.participations?.length > 0 ? (
                            data.participations.map((p: any) => (
                                <div key={p.id} className="p-4 border border-[#FFB700] bg-white rounded-lg hover:bg-gray-50">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="font-medium text-lg text-[#FF5400]">{p.ocr_restaurant}</h3>
                                            <p className="text-sm text-[#FF5400]">
                                                {new Date(p.ocr_date_achat).toLocaleDateString('fr-FR', {
                                                    day: '2-digit',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        <span className="text-lg text-[#FF5400]">{p.ocr_montant} €</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 py-8">
                                Aucune participation enregistrée
                            </p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
