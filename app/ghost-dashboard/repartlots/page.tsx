'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/hooks/useAuth'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import RepartitionLotJourSecoursCrud from '@/components/RepartitionLotJourSecoursCrud'

export default function RepartLotsPage() {
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const [loading, setLoading] = useState(true)
    const [periodeId, setPeriodeId] = useState<string | null>(null)

    useEffect(() => {
        const checkAuth = async () => {
            if (authLoading) return // Attendre que l'authentification soit résolue

            if (!user || !user.email?.endsWith('@beecee.fr')) {
                router.push('/ghost')
                return
            }

            setLoading(false)
        }

        checkAuth()
    }, [user, authLoading, router])

    useEffect(() => {
        const fetchPeriode = async () => {
            const { data, error } = await supabase
                .from('periode_jeu')
                .select('id')
                .order('date_debut', { ascending: false })
                .limit(1)
                .single()

            if (data) setPeriodeId(data.id)
        }

        fetchPeriode()
    }, [])

    if (authLoading || loading || !periodeId) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement...</p>
                </div>
            </div>
        )
    }

    return (
        <DashboardLayout>
            <RepartitionLotJourSecoursCrud />
        </DashboardLayout>
    )
}
