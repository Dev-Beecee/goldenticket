"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase-client"
import DashboardLayout from "@/components/layouts/DashboardLayout"
import AjouterLotDialog from "@/components/AjouterLotDialog"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

type Lot = {
    id: string
    titre: string
    type_valeur: string
    photo_url: string
    type_lot_id: string
}

type TypeLot = {
    id: string
    nom: string
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
                // Charger les types de lot en premier
                const typesResponse = await fetch("https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/type-lot")
                const { data: typesData } = await typesResponse.json()
                setTypesLot(Array.isArray(typesData) ? typesData : [])

                // Charger les lots ensuite
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

            if (!response.ok) throw new Error("Erreur lors de la suppression")

            // Recharger la liste des lots après suppression
            await fetchLots()
            toast.success("Lot supprimé avec succès")
        } catch (error) {
            console.error("Erreur de suppression:", error)
            toast.error("Erreur lors de la suppression du lot")
        }
    }

    // Fonction pour trouver le nom du type de lot
    const getTypeLotNom = (typeLotId: string) => {
        const typeLot = typesLot.find(type => type.id === typeLotId)
        return typeLot ? typeLot.nom : 'Type inconnu'
    }

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Chargement...</div>
    }

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-black">Créer des lots</h1>
                <AjouterLotDialog typesLot={typesLot} onLotAdded={fetchLots} />
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {lots.length > 0 ? (
                    lots.map((lot) => (
                        <div key={lot.id} className="border rounded-lg p-4 shadow-sm bg-white relative">
                            {/* Bouton de suppression */}
                            <button
                                onClick={() => handleDeleteLot(lot.id)}
                                className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700 transition-colors"
                                aria-label="Supprimer le lot"
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
                            <p className="text-sm text-gray-500">
                                Type: {getTypeLotNom(lot.type_lot_id)}
                            </p>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-8 text-gray-500">
                        Aucun lot disponible
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}