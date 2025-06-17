"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import Sidebar from "@/components/sidebar";
import { TirageAuSort } from "@/components/tirage-au-sort/TirageAuSort";

type Boutique = {
    id: string;
    nom: string;
};

type Inscription = {
    id: string;
    nom: string;
    prenom: string;
    email: string;
};

type Participation = {
    id: string;
    boutique_id: string;
    created_at: string;
    boutique: Boutique;
    inscription: Inscription;
};

export default function TiragePage() {
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);
    const [participations, setParticipations] = useState<Participation[]>([]);
    const [loading, setLoading] = useState(true);

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
                .select(`*, boutique: boutique_id (id, nom), inscription: inscription_id (id, nom, prenom, email)`)
                .order("created_at", { ascending: false });

            setParticipations(data || []);
            setLoading(false);
        };

        fetchData();
    }, [router]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
    }
    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };
    const boutiquesUniques = participations
        .map(p => p.boutique)
        .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar onLogout={handleLogout} collapsed={collapsed} setCollapsed={setCollapsed} />

            <main className={`flex-1 transition-all duration-300 ease-in-out ${collapsed ? "ml-20" : "ml-64"} p-6`}>
                <h1 className="text-2xl font-bold mb-6">Tirage au sort</h1>

                <TirageAuSort boutiques={boutiquesUniques} participations={participations} />
            </main>
        </div>
    );
}
