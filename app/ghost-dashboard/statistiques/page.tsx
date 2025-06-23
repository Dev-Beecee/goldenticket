export const dynamic = 'force-dynamic'
export const revalidate = 0

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/types/database"
import DashboardLayout from '@/components/layouts/DashboardLayout'
import StatisticsDashboard from "@/components/statistique/StatisticsDashboard"
import { checkPermission } from "@/lib/server/permit-wrapper"

export default async function StatistiquesPage() {
    const supabase = createServerComponentClient<Database>({
        cookies: () => cookies()
    })

    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error || !user) {
        redirect("/unauthorized")
    }

    const hasPermission = await checkPermission(user.id, "read", "statistique")

    if (!hasPermission) {
        redirect("/unauthorized")
    }

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold text-black mb-6">Statistiques</h1>
            <StatisticsDashboard />
        </DashboardLayout >
    )
}
