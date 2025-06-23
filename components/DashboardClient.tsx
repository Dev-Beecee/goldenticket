'use client'

import { useState } from 'react'
import Image from 'next/image'
import StatCard from '@/components/statistique/StatCard'
import { ChartAreaInteractive } from '@/components/ChartAreaInteractive'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'

type Inscription = {
    id: string
    nom: string
    prenom: string
    email: string
    telephone: string
    accepte_reglement: boolean
    accepte_marketing: boolean
    created_at: string
}

type Restaurant = {
    id: string
    nom: string
    created_at: string
}

type Participation = {
    id: string
    inscription_id: string
    image_url: string | null
    ocr_nom_restaurant: string
    ocr_date_achat: string
    ocr_montant: number
    restaurant_id: string
    statut_validation: string
    created_at: string
    restaurant: Restaurant
    inscription: Inscription
}

export default function DashboardClient({
    participations: initialParticipations,
    inscriptions,
}: {
    participations: Participation[]
    inscriptions: Inscription[]
}) {
    const [participations, setParticipations] = useState<Participation[]>(initialParticipations)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const supabase = createClientComponentClient<Database>()

    const updateParticipationStatus = async (id: string, newStatus: string) => {
        const { error } = await supabase
            .from('participation')
            .update({ statut_validation: newStatus })
            .eq('id', id)

        if (!error) {
            setParticipations((prev) =>
                prev.map((p) => (p.id === id ? { ...p, statut_validation: newStatus } : p))
            )
        }
    }

    const searchLower = searchTerm.toLowerCase()

    const filteredParticipations = participations.filter((p) => {
        const { nom, prenom, email } = p.inscription
        return (
            nom.toLowerCase().includes(searchLower) ||
            prenom.toLowerCase().includes(searchLower) ||
            email.toLowerCase().includes(searchLower)
        )
    })

    return (
        <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="flex justify-center p-4">
                <Image src="/logo.svg" alt="Logo Rubeez" width={89} height={89} />
            </div>

            <ChartAreaInteractive />

            <div className="grid auto-rows-min gap-4 md:grid-cols-2">
                <StatCard
                    title="Participations"
                    value={filteredParticipations.length}
                    percentage={5.2}
                    data={[100, 110, 105, 103, 115, 120, filteredParticipations.length]}
                />
                <StatCard
                    title="Inscriptions"
                    value={inscriptions.length}
                    percentage={3.1}
                    data={[80, 95, 85, 90, 92, 100, inscriptions.length]}
                />
            </div>

            {/* Tu peux ajouter ici ta table des participations, les boutons de validation, modals, etc. */}
        </div>
    )
}
