export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'
import { checkPermission } from '@/lib/server/permit-wrapper'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import StatResume from '@/components/statistique/StatResume';
import DashboardClient from '@/components/DashboardClient'

export default async function GhostDashboard() {
    const cookieStore = cookies()
    const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore })

    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
        redirect('/unauthorized')
    }

    const hasPermission = await checkPermission(user.id, 'read', 'accueil')
    if (!hasPermission) {
        redirect('/unauthorized')
    }

    const res = await fetch(`https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/get-dashboard-data`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
        cache: 'no-store',
    });

    const { participationCount, inscriptionCount } = await res.json();

    return (
        <DashboardLayout>
            <DashboardClient
                participationCount={participationCount}
                inscriptionCount={inscriptionCount}
            />
            <StatResume />
        </DashboardLayout>
    );
}
