'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import PeriodeJeuForm from '@/components/PeriodeJeuForm'
import RepartitionLauncher from '@/components/RepartitionLauncher'
import TableauRepartition from '@/components/TableauRepartition'

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
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-black">Configurer la période de jeu</h1>
                <p className="text-sm text-muted-foreground">
                    Définis les dates de début et de fin pendant lesquelles les lots seront attribués.
                </p>
            </div>

            <PeriodeJeuForm onPeriodeIdChange={(id) => setPeriodeId(id)} />
            <RepartitionLauncher periode_id={periodeId} />
            <TableauRepartition periode_id={periodeId} />
        </DashboardLayout>
    )
}
