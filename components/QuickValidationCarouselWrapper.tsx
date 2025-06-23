"use client";

import { useState } from "react";
import QuickValidationCarousel from "./QuickValidationCarousel";
import { useToast } from "@/hooks/use-toast";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/database";

// Tu peux copier ce type depuis ton composant `ParticipationsTable` si tu veux l’uniformiser
type Participation = {
    id: string;
    restaurant: { nom: string };
    inscription: { nom: string; prenom: string; email: string };
    ocr_date_achat: string;
    ocr_montant: number;
    statut_validation: string;
    image_url: string | null;
};

export default function QuickValidationCarouselWrapper({
    participations,
}: {
    participations: Participation[];
}) {
    const [localParticipations, setLocalParticipations] = useState(participations);
    const supabase = createClientComponentClient<Database>();
    const { toast } = useToast();

    const updateParticipationStatus = async (id: string, newStatus: string) => {
        const { error } = await supabase
            .from("participation")
            .update({ statut_validation: newStatus })
            .eq("id", id);

        if (error) {
            toast({
                title: "Erreur",
                description: "Impossible de mettre à jour la participation.",
                variant: "destructive",
            });
            return;
        }

        setLocalParticipations((prev) =>
            prev.map((p) => (p.id === id ? { ...p, statut_validation: newStatus } : p))
        );

        toast({
            title: "Succès",
            description: "Le statut a été mis à jour.",
        });
    };

    return (
        <QuickValidationCarousel
            participations={localParticipations}
            updateParticipationStatus={updateParticipationStatus}
        />
    );
}
