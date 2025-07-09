import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/types/database"
import DashboardLayout from "@/components/layouts/DashboardLayout";
import ParticipationPerDayChart from "@/components/statistique/ParticipationPerDayChart";

import ParticipationsTableWrapper from "@/components/ParticipationsTableWrapper"
import SearchBar from "@/components/SearchBar"
import QuickValidationCarouselWrapper from "@/components/QuickValidationCarouselWrapper"
import { checkPermission } from "@/lib/server/permit-wrapper"

type Inscription = {
    id: string;
    nom: string;
    prenom: string;
    email: string;
};

type Restaurant = {
    id: string;
    nom: string;
};

type Participation = {
    id: string;
    inscription_id: string;
    image_url: string | null;
    ocr_date_achat: string;
    ocr_montant: number;
    restaurant_id: string;
    statut_validation: string;
    created_at: string;
    restaurant: Restaurant;
    inscription: Inscription;
};

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
        .select("*, restaurant:restaurant_id (id, nom), inscription:inscription_id (id, nom, prenom, email)")
        .not("statut_validation", "in", '("invalide")')
        .order("created_at", { ascending: false })

    const searchTerm = searchParams?.search?.toString().toLowerCase() || ""

    const filteredParticipations = participations?.filter((p) =>
        p.inscription.nom.toLowerCase().includes(searchTerm) ||
        p.inscription.prenom.toLowerCase().includes(searchTerm) ||
        p.inscription.email.toLowerCase().includes(searchTerm)
    ) || []

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold mb-4 text-black">Liste des Participations</h1>

            <SearchBar placeholder="Rechercher par nom, prénom ou email..." />
            <ParticipationPerDayChart />
            <QuickValidationCarouselWrapper participations={filteredParticipations} />

            <div className="mt-10">
                <ParticipationsTableWrapper participations={filteredParticipations} />
            </div>
        </DashboardLayout>
    );
}
