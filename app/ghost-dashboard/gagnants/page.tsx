export const dynamic = 'force-dynamic'
export const revalidate = 0

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/types/database"
import DashboardLayout from '@/components/layouts/DashboardLayout'
import { GagnantsTable } from "@/components/GagnantsTable"
import { checkPermission } from "@/lib/server/permit-wrapper"

export default async function GagnantsPage() {
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

    const hasPermission = await checkPermission(user.id, "read", "gagnant")

    if (!hasPermission) {
        redirect("/unauthorized")
    }

    const { data: participations } = await supabase
        .from("participation")
        .select("*, inscription:inscription_id (id, nom, prenom, email), restaurant:restaurant_id (id, nom)")
        .eq("statut_validation", "gagné")
        .order("created_at", { ascending: false })

    return (

        <DashboardLayout>
            <h1 className="text-2xl font-bold mb-4 text-black">Gagnants</h1>

            <GagnantsTable />

        </DashboardLayout >
    )
}
