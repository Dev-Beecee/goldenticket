export const dynamic = "force-dynamic"
export const revalidate = 0

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/types/database"
import { checkPermission } from "@/lib/server/permit-wrapper"

import DashboardLayout from "@/components/layouts/DashboardLayout"
import RestaurantCrud from "@/components/RestaurantCrud"

export default async function RestaurantsPage() {
    const cookieStore = cookies()
    const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore })

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error || !user) {
        redirect("/unauthorized")
    }

    const hasPermission = await checkPermission(user.id, "manage", "restaurant")

    if (!hasPermission) {
        redirect("/unauthorized")
    }

    return (
        <DashboardLayout>
            <RestaurantCrud />
        </DashboardLayout>
    )
} 