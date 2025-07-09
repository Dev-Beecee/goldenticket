"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";

type Participation = {
    id: string;
    restaurant: { nom: string };
    inscription: { nom: string; prenom: string; email: string };
    ocr_date_achat: string;
    ocr_montant: number;
    statut_validation: string;
    image_url: string | null;
    ocr_restaurant?: string | null;
};

type QuickValidationCarouselProps = {
    participations: Participation[];
    updateParticipationStatus: (id: string, newStatus: string) => void;
};

export default function QuickValidationCarousel({
    participations,
    updateParticipationStatus,
}: QuickValidationCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [localParticipations, setLocalParticipations] = useState(participations);

    const enAttente = localParticipations.filter(
        (p) => p.statut_validation === "en attente"
    );

    // Recalibrer l'index si nécessaire
    useEffect(() => {
        if (currentIndex >= enAttente.length && enAttente.length > 0) {
            setCurrentIndex(0);
        }
    }, [currentIndex, enAttente.length]);

    // Si toutes les participations sont validées
    if (enAttente.length === 0) {
        return (
            <div className="text-center mt-8">
                <p className="text-black text-lg mb-4">🎉 Toutes les participations en attente ont été traitées.</p>
                <Button className="bg-black text-white" onClick={() => window.location.reload()}>
                    Recharger la page
                </Button>
            </div>
        );
    }

    const current = enAttente[currentIndex] ?? null;
    if (!current) {
        return <p className="text-black text-center">Chargement de la participation suivante...</p>;
    }

    const handleStatusChange = (id: string, newStatus: string) => {
        updateParticipationStatus(id, newStatus);
        setLocalParticipations((prev) =>
            prev.map((p) => (p.id === id ? { ...p, statut_validation: newStatus } : p))
        );
        setTimeout(() => {
            if (currentIndex < enAttente.length - 1) {
                setCurrentIndex((i) => i + 1);
            }
        }, 200);
    };

    return (
        <div className="max-w-4xl mx-auto mt-8">
            <h1 className="text-2xl font-bold mb-6 text-black">
                Validation en attente — {enAttente.length} participation
                {enAttente.length > 1 ? "s" : ""} restante
                {enAttente.length > 1 ? "s" : ""}
            </h1>

            <div className="bg-white rounded shadow p-6 flex flex-col md:flex-row gap-6 items-start">
                {/* Image */}
                <div className="w-full md:w-1/2">
                    {current.image_url ? (
                        <img src={current.image_url} alt="Ticket" className="w-full rounded border" />
                    ) : (
                        <div className="w-full h-[300px] flex items-center justify-center border rounded text-gray-400">
                            Aucune image
                        </div>
                    )}
                </div>

                {/* Infos et statut */}
                <div className="w-full md:w-1/2 space-y-4 text-black">
                    <div>
                        <p><strong>Restaurant :</strong> {current.restaurant?.nom || current.ocr_restaurant || "Non renseigné"}</p>
                        <p><strong>Nom :</strong> {current.inscription.nom}</p>
                        <p><strong>Prénom :</strong> {current.inscription.prenom}</p>
                        <p><strong>Email :</strong> {current.inscription.email}</p>
                        <p><strong>Date d'achat :</strong> {new Date(current.ocr_date_achat).toLocaleDateString()}</p>
                        <p><strong>Montant :</strong> {current.ocr_montant.toFixed(2)} €</p>
                    </div>

                    <Select
    value={current.statut_validation || "placeholder"}
    onValueChange={(value) => handleStatusChange(current.id, value)}
>
    <SelectTrigger className="w-full bg-white text-black border border-gray-300">
        <span className="text-black">
            {["validé", "rejeté"].includes(current.statut_validation)
                ? current.statut_validation
                : "Changer le statut"}
        </span>
    </SelectTrigger>
    <SelectContent>
        <SelectItem disabled value="placeholder">
            Changer le statut
        </SelectItem>
        <SelectItem value="validé">Validé</SelectItem>
        <SelectItem value="rejeté">Rejeté</SelectItem>
    </SelectContent>
</Select>


                    <div className="flex justify-between pt-4">
                        <Button
                            onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
                            disabled={currentIndex === 0}
                        >
                            Précédent
                        </Button>
                        <Button
                            onClick={() => setCurrentIndex((i) => Math.min(i + 1, enAttente.length - 1))}
                            disabled={currentIndex === enAttente.length - 1}
                        >
                            Suivant
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
