"use client"

import { useRouter } from "next/navigation"

export default function UnauthorizedPage() {
    const router = useRouter()

    return (
        <div className="h-screen bg-white flex flex-col justify-center items-center text-center">
            <div className="p-10 text-red-600">
                <h1 className="text-2xl font-bold">⛔ Accès refusé</h1>
                <p className="mt-2 text-black">Tu n’as pas les permissions nécessaires pour accéder à cette page.</p>
                <button
                    onClick={() => router.push("/ghost-dashboard")}
                    className="mt-6 bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                >
                    Retour au dashboard
                </button>
            </div>
        </div>
    )
}
