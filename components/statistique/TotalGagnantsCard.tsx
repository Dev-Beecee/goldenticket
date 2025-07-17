"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/lib/supabase-client"; 

type TotalGagnantsData = {
    total_gagnants: number;
};

export default function TotalGagnantsCard() {
    const [data, setData] = useState<TotalGagnantsData | null>(null);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const fetchTotalGagnants = async () => {
        setLoading(true);
        try {
            const { count, error } = await supabase
                .from("lot_attribue")
                .select("*", { count: "exact", head: true });

            if (error) {
                throw error;
            }

            setData({ total_gagnants: count || 0 });
            toast({ title: "Nombre de gagnants chargé avec succès." });
        } catch (error) {
            console.error("Erreur Supabase:", error);
            toast({ title: "Erreur lors du chargement du nombre de gagnants", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTotalGagnants();
    }, []);

    return (
        <div className="space-y-6">
            

            {data && (
                <Card className="bg-white shadow-md border-none text-black">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total des Gagnants
                        </CardTitle>
                        <Trophy className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.total_gagnants}</div>
                        
                    </CardContent>
                </Card>
            )}

            {!data && !loading && (
                <Card className="bg-white">
                    <CardContent className="pt-6">
                        <p className="text-gray-500 text-center">
                            Aucune donnée disponible. Cliquez sur "Actualiser le nombre de gagnants" pour charger les statistiques.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
