"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import InscriptionsTable from "@/components/inscription-table/InscriptionsTable";
import ParticipationsTable from "@/components/participation-table/ParticipationsTable";
import CreateRepartitionForm from "@/components/CreateRepartitionForm";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

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
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                        Déconnexion
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    {/* Statistiques */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Participations
                                </h3>
                                <p className="mt-2 text-3xl font-bold text-indigo-600">
                                    {participationCount}
                                </p>
                            </div>
                        </div>
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Inscriptions
                                </h3>
                                <p className="mt-2 text-3xl font-bold text-indigo-600">
                                    {inscriptionCount}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Barre de recherche */}
                    <div className="mb-8">
                        <input
                            type="text"
                            placeholder="Rechercher par nom, prénom ou email..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Tables */}
                    <ParticipationsTable
                        participations={filteredParticipations}
                        updateParticipationStatus={updateParticipationStatus}
                        setSelectedImage={setSelectedImage}
                        setIsModalOpen={setIsModalOpen}
                    />

                    <InscriptionsTable inscriptions={filteredInscriptions} />
                </div>
                <div className="mb-8">
                    <CreateRepartitionForm />
                </div>

            </main>

            {/* Lightbox */}
            {isModalOpen && selectedImage && (
                <Lightbox
                    open={isModalOpen}
                    close={() => setIsModalOpen(false)}
                    slides={[{ src: selectedImage }]}
                />
            )}
        </div>
    );
}
