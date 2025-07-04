"use client";
import { useEffect, useState } from "react";
import { Info } from 'lucide-react'
import { supabase } from "@/lib/supabase-client";

export function RegistrationConsigne() {
    const [consigneUrl, setConsigneUrl] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            const { data } = await supabase.from("reglage_site").select("consigne_image_url").limit(1).single();
            setConsigneUrl(data?.consigne_image_url || null);
        })();
    }, []);

    return (
        <div className="mb-8 text-center">
            <div className="flex justify-center mb-4">
                {consigneUrl ? (
                    <img src={consigneUrl} alt="Consigne" className="h-16 w-16 rounded-full object-cover" />
                ) : (
                    <div className="h-16 w-16 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                        <Info className="h-8 w-8" />
                    </div>
                )}
            </div>
            <h2 className="text-2xl font-semibold tracking-tight mb-3">Consignes de participation</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
                Veuillez conserver votre preuve d'achat. Assurez-vous de fournir des informations exactes pour que votre demande soit valide. Toute participation incomplète ne sera pas prise en compte.
            </p>
        </div>
    )
}
