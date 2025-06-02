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

    // Utilisation de SWR pour le polling toutes les 5 secondes
    const { data, error } = useSWR(
        ['https://nkymassyzvfwzrjekatr.supabase.co/functions/v1/get-user-participations', inscriptionId],
        ([url, id]) => fetcher(url, id),
        { refreshInterval: 5000 } // Rafraîchissement toutes les 5 secondes
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

    if (!data?.user) return <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse"></div>

    // Formatage du nom avec première lettre + point
    const formattedName = `${data.user.prenom} ${data.user.nom.charAt(0)}.`

    return (
        <>
            {/* Carte centrée */}
            <div className="flex justify-center">
                <div
                    onClick={() => setIsDialogOpen(true)}
                    className="flex flex-col items-center p-6 rounded-lg shadow-md bg-white cursor-pointer hover:shadow-lg transition-shadow max-w-xs w-full"
                >
                    <h3 className="text-xl font-semibold text-center">
                        {formattedName}
                    </h3>
                    <p className="text-gray-500 mt-2">
                        {data.user.participationsCount} participation{data.user.participationsCount !== 1 ? 's' : ''}
                    </p>
                    <button className="mt-4 text-blue-600 hover:underline">
                        Voir détails
                    </button>
                </div>
            </div>

            {/* Popup des participations */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">
                            {formattedName} - {data.user.participationsCount} participation{data.user.participationsCount !== 1 ? 's' : ''}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        {data.participations?.length > 0 ? (
                            data.participations.map((p: any) => (
                                <div key={p.id} className="p-4 border rounded-lg hover:bg-gray-50">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="font-medium text-lg">{p.ocr_nom_boutique}</h3>
                                            <p className="text-sm text-gray-500">
                                                {new Date(p.ocr_date_achat).toLocaleDateString('fr-FR', {
                                                    day: '2-digit',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        <span className="font-bold text-blue-600 text-lg">
                                            {p.ocr_montant} €
                                        </span>
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