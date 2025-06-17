"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layouts/DashboardLayout"
import StatCard from "@/components/statistique/StatCard";
import { ChartAreaInteractive } from "@/components/ChartAreaInteractive"
import Image from "next/image"


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
    inscription_id: string;
    image_url: string | null;
    ocr_nom_boutique: string;
    ocr_date_achat: string;
    ocr_montant: number;
    boutique_id: string;
    statut_validation: string;
    created_at: string;
    boutique: Boutique;
    inscription: Inscription;
};

export default function GhostDashboard() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [participations, setParticipations] = useState<Participation[]>([]);
    const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
    const [participationCount, setParticipationCount] = useState(0);
    const [inscriptionCount, setInscriptionCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user || !user.email?.endsWith("@beecee.fr")) {
                router.push("/login");
                return;
            }

            setUser(user);

            const { data: participationsData } = await supabase
                .from("participation")
                .select(
                    `*, boutique: boutique_id (nom), inscription: inscription_id (nom, prenom, email)`
                )
                .order("created_at", { ascending: false });

            setParticipations((participationsData as Participation[]) || []);
            setParticipationCount(participationsData?.length || 0);

            const { data: inscriptionsData } = await supabase
                .from("inscription")
                .select("*")
                .order("created_at", { ascending: false });

            setInscriptions((inscriptionsData as Inscription[]) || []);
            setInscriptionCount(inscriptionsData?.length || 0);

            setLoading(false);
        };

        fetchData();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    const updateParticipationStatus = async (id: string, newStatus: string) => {
        const { error } = await supabase
            .from("participation")
            .update({ statut_validation: newStatus })
            .eq("id", id);

        if (!error) {
            setParticipations((prev) =>
                prev.map((p) =>
                    p.id === id ? { ...p, statut_validation: newStatus } : p
                )
            );
        }
    };

    const searchLower = searchTerm.toLowerCase();

    const filteredParticipations = participations.filter((p) => {
        const { nom, prenom, email } = p.inscription;
        return (
            nom.toLowerCase().includes(searchLower) ||
            prenom.toLowerCase().includes(searchLower) ||
            email.toLowerCase().includes(searchLower)
        );
    });

    const filteredInscriptions = inscriptions.filter((i) => {
        return (
            i.nom.toLowerCase().includes(searchLower) ||
            i.prenom.toLowerCase().includes(searchLower) ||
            i.email.toLowerCase().includes(searchLower)
        );
    });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Chargement...
            </div>
        );
    }

    return (




        <DashboardLayout>
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex  gap-4 p-4 justify-center"> <Image src="/logo.svg" alt="Logo Rubeez" width={89} height={89} /></div>
                <ChartAreaInteractive />
                <div className="grid auto-rows-min gap-4 md:grid-cols-2">

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

