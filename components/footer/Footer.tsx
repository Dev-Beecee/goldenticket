'use client'

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";

export function Footer() {
    const [reglementUrl, setReglementUrl] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            const { data } = await supabase.from("reglage_site").select("reglement").limit(1).single();
            setReglementUrl(data?.reglement || null);
        })();
    }, []);

    return (
        <footer className="w-full border-t mt-12 py-6 text-center text-sm text-muted-foreground">
            <a
                href={reglementUrl || "/documents/reglement.pdf"}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
            >
                Réglement
            </a>
        </footer>
    )
}