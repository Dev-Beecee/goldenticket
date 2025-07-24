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

type DashboardClientProps = {
    participationCount: number;
    inscriptionCount: number;
    participationToday: number;
    participationYesterday: number;
    inscriptionToday: number;
    inscriptionYesterday: number;
};

export default function DashboardClient({
    participationCount,
    inscriptionCount,
    participationToday,
    participationYesterday,
    inscriptionToday,
    inscriptionYesterday,
}: DashboardClientProps) {
    // Utilisez participationCount et inscriptionCount pour afficher les données
    return (
        <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="flex justify-center p-4">
                <Image src="/logo.svg" alt="Logo Rubeez" width={89} height={89} />
            </div>

            <ChartAreaInteractive />

            <div className="grid auto-rows-min gap-4 md:grid-cols-2">
                <StatCard
                    title="Participations"
                    value={participationCount}
                    today={participationToday}
                    yesterday={participationYesterday}
                    data={[100, 110, 105, 103, 115, 120, participationCount]}
                />
                <StatCard
                    title="Inscriptions"
                    value={inscriptionCount}
                    today={inscriptionToday}
                    yesterday={inscriptionYesterday}
                    data={[80, 95, 85, 90, 92, 100, inscriptionCount]}
                />
            </div>
        </div>
    );
}
