// components/SearchBar.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface SearchBarProps {
    placeholder: string;
    defaultValue?: string;
}

export default function SearchBar({ placeholder, defaultValue = "" }: SearchBarProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState(defaultValue);

    // Synchronise l'état initial avec les changements de defaultValue
    useEffect(() => {
        setSearchTerm(defaultValue);
    }, [defaultValue]);

    // Délai pour éviter des requêtes trop fréquentes
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm) {
                router.push(`?search=${encodeURIComponent(searchTerm)}`);
            } else {
                router.push("");
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, router]);

    return (
        <div className="mb-6">
            <input
                type="text"
                placeholder={placeholder}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
    );
}