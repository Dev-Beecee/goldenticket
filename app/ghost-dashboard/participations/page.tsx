"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import DashboardLayout from "@/components/layouts/DashboardLayout"

import ParticipationsTable from "@/components/participation-table/ParticipationsTable";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

type Inscription = {
    id: string;
    nom: string;
    prenom: string;
    email: string;
};

type Boutique = {
    id: string;
    nom: string;
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

export default function ParticipationsPage() {
    const router = useRouter();
    const [participations, setParticipations] = useState<Participation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user || !user.email?.endsWith("@beecee.fr")) {
                router.push("/login");
                return;
            }

            const { data } = await supabase
                .from("participation")
                .select("*, boutique: boutique_id (id, nom), inscription: inscription_id (id, nom, prenom, email)")
                .order("created_at", { ascending: false });

            setParticipations((data as Participation[]) || []);
            setLoading(false);
        };

        fetchData();
    }, [router]);

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

    const filteredParticipations = participations.filter((p) => {
        const term = searchTerm.toLowerCase();
        return (
            p.inscription.nom.toLowerCase().includes(term) ||
            p.inscription.prenom.toLowerCase().includes(term) ||
            p.inscription.email.toLowerCase().includes(term)
        );
    });
    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
    }

    return (

        <DashboardLayout>


            <h1 className="text-2xl font-bold mb-4 text-black">Liste des Participations</h1>

            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Rechercher par nom, prénom ou email..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <ParticipationsTable
                participations={filteredParticipations}
                updateParticipationStatus={updateParticipationStatus}
                setSelectedImage={setSelectedImage}
                setIsModalOpen={setIsModalOpen}
            />

            {
                isModalOpen && selectedImage && (
                    <Lightbox
                        open={isModalOpen}
                        close={() => setIsModalOpen(false)}
                        slides={[{ src: selectedImage }]}
                    />
                )
            }
        </DashboardLayout >

    );
}
