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
        <footer className="w-full border-t mt-12 py-6 text-center text-sm text-white">
            <a
                href={reglementUrl || "/documents/reglement.pdf"}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline underline"
                style={{ fontWeight: 700 }}
            >
               Voir le règlement du jeu
            </a>
            <div className="bg-black text-white flex items-center justify-center py-[20px] px-[4px] mt-4 ">
                <a href="/mentions-legales" className="hover:underline">Mentions légales</a>
                <span className="mx-2">|</span>
                <a href="/politique-confidentialite" className="hover:underline">Politique de confidentialité</a>
                <span className="ml-4">
                  <svg width="22" height="21" viewBox="0 0 22 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.3537 0.0933838H4.45094C2.40346 0.0933838 0.743652 1.75319 0.743652 3.80067V16.7034C0.743652 18.7509 2.40346 20.4107 4.45094 20.4107H17.3537C19.4012 20.4107 21.061 18.7509 21.061 16.7034V3.80067C21.061 1.75319 19.4012 0.0933838 17.3537 0.0933838Z" fill="white"/>
                    <path d="M7.11694 13.4289V11.5179L14.687 9.53381V11.031L9.02747 12.4796L14.687 13.9157V15.4129L7.11694 13.4289Z" fill="black"/>
                    <path d="M7.11694 10.9699V9.4727L12.7884 8.03658L7.11694 6.58804V5.09082L14.687 7.07486V8.98588L7.11694 10.9699Z" fill="black"/>
                  </svg>
                </span>
            </div>
        </footer>
    )
}