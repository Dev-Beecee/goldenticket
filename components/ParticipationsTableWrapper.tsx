"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { useToast } from "@/hooks/use-toast";
import ParticipationsTable from "./participation-table/ParticipationsTable";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

export default function ParticipationsTableWrapper({ participations: initialParticipations }: { participations: any[] }) {
    const [participations, setParticipations] = useState(initialParticipations);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { toast } = useToast();

    const updateParticipationStatus = async (id: string, newStatus: string) => {
        const { error } = await supabase
            .from("participation")
            .update({ statut_validation: newStatus })
            .eq("id", id);

        if (error) {
            toast({
                title: "Erreur",
                description: "La mise à jour du statut a échoué",
                variant: "destructive",
            });
        } else {
            // 🔄 Mise à jour locale de la participation modifiée
            setParticipations((prev) =>
                prev.map((p) =>
                    p.id === id ? { ...p, statut_validation: newStatus } : p
                )
            );

            toast({
                title: "Succès",
                description: "Statut mis à jour avec succès",
            });
        }
    };

    return (
        <>
            <ParticipationsTable
                participations={participations}
                updateParticipationStatus={updateParticipationStatus}
                setSelectedImage={setSelectedImage}
                setIsModalOpen={setIsModalOpen}
            />

            {isModalOpen && selectedImage && (
                <Lightbox
                    open={isModalOpen}
                    close={() => setIsModalOpen(false)}
                    slides={[{ src: selectedImage }]}
                />
            )}
        </>
    );
}
