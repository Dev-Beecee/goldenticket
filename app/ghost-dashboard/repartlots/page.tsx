'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import RepartitionLotJourSecoursCrud from '@/components/RepartitionLotJourSecoursCrud'

export default function RepartLotsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [periodeId, setPeriodeId] = useState<string | null>(null)

    useEffect(() => {
        const checkAuth = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user || !user.email?.endsWith('@beecee.fr')) {
                router.push('/login')
                return
            }

            setLoading(false)
        }

        checkAuth()
    }, [router])

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

    if (loading || !periodeId) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Chargement...
            </div>
        )
    }

    return (
        <DashboardLayout>
            
           
            
<RepartitionLotJourSecoursCrud />
        </DashboardLayout>
    )
}
