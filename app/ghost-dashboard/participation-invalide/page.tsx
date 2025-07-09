// app/participation/page.tsx
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/types/database"
import DashboardLayout from '@/components/layouts/DashboardLayout'
import ParticipationsInvalidesTableWrapper from "@/components/ParticipationsInvalidesTableWrapper"
import { checkPermission } from "@/lib/server/permit-wrapper"

export default async function ParticipationsPage({
    searchParams,
}: {
    searchParams?: { [key: string]: string | string[] | undefined }
}) {
    const cookieStore = cookies()
    const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore })

    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error || !user) {
        redirect("/unauthorized")
    }

    const hasPermission = await checkPermission(user.id, "read", "participation")

    if (!hasPermission) {
        redirect("/unauthorized")
    }

    // Récupération des données
    const { data: participations } = await supabase
        .from("participation")
        .select("*, boutique: boutique_id (id, nom), inscription: inscription_id (id, nom, prenom, email)")
        .in("statut_validation", ["invalide"])
        .order("created_at", { ascending: false })

    const searchTerm = searchParams?.search?.toString().toLowerCase() || ""

    const filteredParticipations = participations?.filter((p) =>
        p.inscription.nom.toLowerCase().includes(searchTerm) ||
        p.inscription.prenom.toLowerCase().includes(searchTerm) ||
        p.inscription.email.toLowerCase().includes(searchTerm)
    ) || []

    return (
        <DashboardLayout>
            <ParticipationsInvalidesTableWrapper participations={filteredParticipations} />
        </DashboardLayout>
    )
}
