export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'
import { checkPermission } from '@/lib/server/permit-wrapper'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import InscriptionsPageClient from '@/components/inscription-table/InscriptionsPageClient'

export default async function InscriptionsPage() {
    const cookieStore = cookies()
    const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore })

    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
        redirect('/unauthorized')
    }

    const hasPermission = await checkPermission(user.id, 'read', 'inscription')
    if (!hasPermission) {
        redirect('/unauthorized')
    }

    const { data: inscriptionsData, error: inscriptionError } = await supabase
        .from('inscription')
        .select('*, participations:participation(id)')
        .order('created_at', { ascending: false })

    const { data: partagesData } = await supabase
        .rpc('count_partages_by_inscription')

    const partageMap = new Map<string, number>();
    (partagesData || []).forEach((row: any) => {
        partageMap.set(row.inscription_id, row.count);
    });

    const inscriptionsWithCount = (inscriptionsData || []).map((insc: any) => ({
        ...insc,
        participationsCount: insc.participations ? insc.participations.length : 0,
        partagesCount: partageMap.get(insc.id) || 0,
    }))

    return (
        <DashboardLayout>
            <InscriptionsPageClient inscriptions={inscriptionsWithCount} />
        </DashboardLayout>
    )
}
