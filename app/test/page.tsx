"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout"
import StatCard from "@/components/statistique/StatCard";


// Types
type Inscription = {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    accepte_reglement: boolean;
    accepte_marketing: boolean;
    created_at: string;
};

type Boutique = {
    id: string;
    nom: string;
    created_at: string;
};

type Participation = {
    id: string;
    boutique_id: string;
    created_at: string;
    boutique: Boutique;
    inscription: Inscription;
};


export default function GhostDashboard() {
    const [participations, setParticipations] = useState<Participation[]>([]);
    const [inscriptions, setInscriptions] = useState<Inscription[]>([]);

    return (
        <DashboardLayout>
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">

                    <StatCard
                        title="Participations"
                        value={participations.length}
                        percentage={5.2}
                        data={[100, 110, 105, 103, 115, 120, participations.length]}
                    />
                    <StatCard
                        title="Inscriptions"
                        value={inscriptions.length}
                        percentage={3.1}
                        data={[80, 95, 85, 90, 92, 100, inscriptions.length]}
                    />
                </div>
            </div>
        </DashboardLayout>
    )
}
