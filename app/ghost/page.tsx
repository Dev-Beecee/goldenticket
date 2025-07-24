"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs"
import { supabase } from "@/lib/supabase-client"
import { Database } from "@/types/database"

export default function Login() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isCheckingPermission, setIsCheckingPermission] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (isSubmitting || isCheckingPermission) return

        setIsSubmitting(true)
        setError(null)
        console.log("[LOGIN] Tentative de connexion")

        try {
            if (!email.endsWith("@beecee.fr")) {
                throw new Error("Vous êtes pas autorisé a vous connecter")
            }

            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (authError || !data.user) {
                throw authError || new Error("Email ou mot de passe incorrect")
            }

            const user = data.user
            console.log("[LOGIN] Utilisateur connecté :", user)

            // 🔁 Synchronisation Permit.io
            const syncBody = {
                id: user.id,
                email: user.email ?? "",
                firstName: user.user_metadata?.firstName ?? "",
                lastName: user.user_metadata?.lastName ?? "",
                role: user.user_metadata?.role ?? "client",
            }

            console.log("[PERMIT] Sync vers /api/sync-user :", syncBody)

            setIsCheckingPermission(true)
            const syncRes = await fetch("/api/sync-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(syncBody),
            })
            setIsCheckingPermission(false)

            if (!syncRes.ok) {
                console.error("[PERMIT] Échec de sync :", await syncRes.text())
            } else {
                console.log("[PERMIT] Sync réussie")
            }

            // ⏫ Mise à jour session pour SSR
            const supabaseBrowserClient = createPagesBrowserClient<Database>()
            await supabaseBrowserClient.auth.setSession({
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token
            })

            console.log("[SESSION] Session mise à jour. Redirection.")
            router.replace("/ghost-dashboard")
        } catch (err) {
            console.error("[LOGIN] Erreur :", err)
            setError(err instanceof Error ? err.message : "Erreur inconnue")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
                <h2 className="text-center text-3xl font-extrabold text-gray-900">Connexion Admin</h2>

                {error && (
                    <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
                        {error}
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            id="email"
                            type="email"
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isSubmitting || isCheckingPermission}
                            placeholder="votre@beecee.fr"
                            autoComplete="username"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mot de passe</label>
                        <input
                            id="password"
                            type="password"
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isSubmitting || isCheckingPermission}
                            placeholder="••••••••"
                            autoComplete="current-password"
                        />
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isSubmitting || isCheckingPermission}
                            className={`w-full flex justify-center py-2 px-4 rounded-md text-white font-medium ${(isSubmitting || isCheckingPermission)
                                ? "bg-gray-700 cursor-not-allowed"
                                : "bg-black hover:bg-gray-900"
                                }`}
                        >
                            {(isSubmitting || isCheckingPermission) ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {isCheckingPermission ? "Vérification des permissions..." : "Connexion en cours..."}
                                </>
                            ) : (
                                "Se connecter"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
