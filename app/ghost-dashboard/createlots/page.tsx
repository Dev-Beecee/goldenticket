export const dynamic = "force-dynamic"
export const revalidate = 0

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/types/database"
import { checkPermission } from "@/lib/server/permit-wrapper"

import CreateLotsPage from "@/components/CreateLotsPage" // ← composant client
import DashboardLayout from "@/components/layouts/DashboardLayout"

export default async function LotsPage() {
    const cookieStore = cookies()
    const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore })

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error || !user) {
        redirect("/unauthorized")
    }

    const hasPermission = await checkPermission(user.id, "manage", "lot")

    if (!hasPermission) {
        redirect("/unauthorized")
    }

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold mb-4 text-black">Création de lot</h1>

            <CreateLotsPage />
        </DashboardLayout >
    )
}