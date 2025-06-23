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
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <DashboardLayout>
            <InscriptionsPageClient inscriptions={inscriptionsData || []} />
        </DashboardLayout>
    )
}
