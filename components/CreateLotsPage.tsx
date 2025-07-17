'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase-client"
import AjouterLotDialog from "@/components/AjouterLotDialog"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type Lot = {
    id: string
    titre: string
    type_valeur: string
    photo_url: string
    type_lot_id: string
    instructions?: string
    quantite_disponible: number
    priorite: number
    date_distribution?: string
    heure_distribution?: string
    recuperation?: string
}

type TypeLot = {
    id: string
    nom: string
    priorite: number
}

export default function CreateLotsPage() {
    const router = useRouter()
    const [lots, setLots] = useState<Lot[]>([])
    const [typesLot, setTypesLot] = useState<TypeLot[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user || !user.email?.endsWith("@beecee.fr")) {
                router.push("/login")
                return
            }

            try {
                const typesResponse = await fetch("https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/type-lot")
                const { data: typesData } = await typesResponse.json()
                setTypesLot(Array.isArray(typesData) ? typesData : [])

                await fetchLots()
            } catch (error) {
                console.error("Erreur de chargement:", error)
                setTypesLot([])
                setLots([])
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [router])

    const fetchLots = async () => {
        try {
            const response = await fetch("https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/lots")
            const { data } = await response.json()
            setLots(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error("Erreur de chargement des lots:", error)
            throw error
        }
    }

    const handleDeleteLot = async (lotId: string) => {
        try {
            const confirmation = confirm("Êtes-vous sûr de vouloir supprimer ce lot ?")
            if (!confirmation) return

            const response = await fetch(`https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/lots?id=${lotId}`, {
                method: "DELETE"
            })

            if (!response.ok) {
                throw new Error("Erreur lors de la suppression")
            }

            await fetchLots()
            toast.success("Lot supprimé avec succès")
        } catch (error) {
'use client'
            console.error("Erreur de suppression:", error)
            toast.error("Erreur lors de la suppression du lot")
        }
    }

    const getTypeLotNom = (typeLotId: string) => {
        const typeLot = typesLot.find(type => type.id === typeLotId)
        return typeLot ? typeLot.nom : 'Type inconnu'
    }

    // Ajout d'une fonction utilitaire pour formater la date au format français
    function formatDateFr(dateStr?: string) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('fr-FR');
    }

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Chargement...</div>
    }

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                
                <AjouterLotDialog typesLot={typesLot} onLotAdded={fetchLots} />
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {lots.length > 0 ? (
                    lots.map((lot) => (
                        <div key={lot.id} className="border rounded-lg p-4 shadow-sm bg-white relative">
                            {/* Bouton de suppression */}
                            <button
    onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleDeleteLot(lot.id);
    }}
    className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700 transition-colors z-10"
    aria-label="Supprimer le lot"
    type="button"
>
    <Trash2 size={18} />
</button>

                            <img
                                src={lot.photo_url}
                                alt={lot.titre}
                                className="w-full h-40 object-cover rounded-md mb-2"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/placeholder-image.jpg'
                                }}
                            />
                            <h3 className="text-lg font-semibold">{lot.titre}</h3>
                            <p className="text-sm text-gray-500">{lot.type_valeur}</p>
                            <p className="text-sm text-gray-500">Type: {getTypeLotNom(lot.type_lot_id)}</p>
                            <p className="text-sm text-gray-500">Quantité disponible : {lot.quantite_disponible}</p>
                            <p className="text-sm text-gray-500">Priorité : {lot.priorite}</p>
                            {lot.date_distribution && (
                                <p className="text-sm text-gray-500">Date de distribution : {formatDateFr(lot.date_distribution)}</p>
                            )}
                            {lot.heure_distribution && (
                                <p className="text-sm text-gray-500">Heure de distribution : {lot.heure_distribution}</p>
                            )}
                            {lot.recuperation && (
                                <p className="text-sm text-gray-500">Récupération : {lot.recuperation}</p>
                            )}

                            {lot.instructions && (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="link" className="text-sm p-0 h-auto mt-2">
                                            Voir les instructions de récupération
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                        <DialogHeader>
                                            <DialogTitle>Instructions de récupération</DialogTitle>
                                        </DialogHeader>
                                        <div
                                            className="prose max-w-full"
                                            dangerouslySetInnerHTML={{ __html: lot.instructions }}
                                        />
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-8 text-gray-500">
                        Aucun lot disponible
                    </div>
                )}
            </div>
        </>
    )
}
