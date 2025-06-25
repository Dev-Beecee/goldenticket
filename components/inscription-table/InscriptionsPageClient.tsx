"use client"

import { useState } from "react"
import InscriptionsTable from "@/components/inscription-table/InscriptionsTable"

type Inscription = {
    id: string
    nom: string
    prenom: string
    email: string
    telephone: string
    accepte_reglement: boolean
    accepte_marketing: boolean
    created_at: string
    participationsCount: number
}

export default function InscriptionsPageClient({ inscriptions }: { inscriptions: Inscription[] }) {
    const [searchTerm, setSearchTerm] = useState("")

    const filteredInscriptions = inscriptions.filter((i) => {
        const term = searchTerm.toLowerCase()
        return (
            i.nom.toLowerCase().includes(term) ||
            i.prenom.toLowerCase().includes(term) ||
            i.email.toLowerCase().includes(term)
        )
    })

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4 text-black">Liste des Inscriptions</h1>
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Rechercher par nom, prénom ou email..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <InscriptionsTable inscriptions={filteredInscriptions} />
        </div>
    )
}
