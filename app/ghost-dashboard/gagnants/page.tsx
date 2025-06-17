"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { GagnantsTable } from "@/components/GagnantsTable";

export default function GagnantsPage() {
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            // Vérification de l'utilisateur et du domaine email
            if (!user || !user.email?.endsWith("@beecee.fr")) {
                router.push("/login");
                return;
            }

            setLoading(false);
        };

        checkUser();
    }, [router]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
    }

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    return (
        <DashboardLayout >
            <div className="container mx-auto py-8">
                <h1 className="text-2xl font-bold mb-6">Liste des Gagnants</h1>
                <GagnantsTable />
            </div>
        </DashboardLayout>
    );
}