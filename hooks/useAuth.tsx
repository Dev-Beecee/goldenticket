"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase-client"

interface AuthContextType {
    user: User | null
    loading: boolean
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    refreshUser: async () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    const refreshUser = async () => {
        try {
            const { data: { user }, error } = await supabase.auth.getUser()
            if (error) {
                console.error("[AUTH] Erreur lors de la récupération de l'utilisateur:", error)
                setUser(null)
            } else {
                setUser(user)
            }
        } catch (error) {
            console.error("[AUTH] Erreur inattendue:", error)
            setUser(null)
        }
    }

    useEffect(() => {
        let mounted = true

        // Récupération initiale de l'utilisateur
        const getInitialUser = async () => {
            try {
                const { data: { user }, error } = await supabase.auth.getUser()
                if (mounted) {
                    if (error) {
                        console.error("[AUTH] Erreur lors de la récupération initiale:", error)
                        setUser(null)
                    } else {
                        setUser(user)
                    }
                    setLoading(false)
                }
            } catch (error) {
                if (mounted) {
                    console.error("[AUTH] Erreur inattendue lors de la récupération initiale:", error)
                    setUser(null)
                    setLoading(false)
                }
            }
        }

        getInitialUser()

        // Écoute des changements d'authentification
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!mounted) return

                console.log("[AUTH] État d'authentification changé:", event, session?.user?.id)
                
                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    setUser(session?.user ?? null)
                } else if (event === 'SIGNED_OUT') {
                    setUser(null)
                }
                
                setLoading(false)
            }
        )

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [])

    return (
        <AuthContext.Provider value={{ user, loading, refreshUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth doit être utilisé dans un AuthProvider")
    }
    return context
} 