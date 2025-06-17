"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import DashboardLayout from "@/components/layouts/DashboardLayout"
import InscriptionsTable from "@/components/inscription-table/InscriptionsTable";

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

export default function InscriptionsPage() {
    const router = useRouter();
    const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
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
                .from("inscription")
                .select("*")
                .order("created_at", { ascending: false });

            setInscriptions((data as Inscription[]) || []);
            setLoading(false);
        };

        fetchData();
    }, [router]);

    const filteredInscriptions = inscriptions.filter((i) => {
        const term = searchTerm.toLowerCase();
        return (
            i.nom.toLowerCase().includes(term) ||
            i.prenom.toLowerCase().includes(term) ||
            i.email.toLowerCase().includes(term)
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

        </DashboardLayout >

    );
}
