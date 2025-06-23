"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/types/database"

export default function CreateUserForm() {
    const supabase = createClientComponentClient<Database>()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [role, setRole] = useState("admin")
    const [message, setMessage] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage("")

        const res = await fetch("/api/create-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, role }), // 👈 ici la valeur sélectionnée est bien envoyée
        })

        const result = await res.json()

        if (!res.ok) {
            setMessage("Erreur : " + result.error)
        } else {
            setMessage("Utilisateur créé avec succès !")
            setEmail("")
            setPassword("")
            // ✅ ne surtout pas forcer setRole("admin") ici
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block font-medium text-black">Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    required
                />
            </div>
            <div>
                <label className="block font-medium text-black">Mot de passe</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    required
                />
            </div>
            <div>
                <label className="block font-medium text-black">Rôle</label>
                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                >
                    <option value="admin">Admin</option>
                    <option value="admin-mcdo">Admin Mcdo</option>
                </select>
            </div>
            <button
                type="submit"
                className="bg-black text-white px-4 py-2 rounded "
            >
                Créer l'utilisateur
            </button>
            {message && <p className="mt-2 text-sm text-gray-700">{message}</p>}
        </form>
    )
}
