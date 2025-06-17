"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import DashboardLayout from "@/components/layouts/DashboardLayout"

import StatisticsDashboard from "@/components/statistique/StatisticsDashboard";

export default function StatistiquesPage() {
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();

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
        <DashboardLayout>
            <h1 className="text-2xl font-bold mb-6">Statistiques</h1>
            <StatisticsDashboard />
        </DashboardLayout>
    );
}
