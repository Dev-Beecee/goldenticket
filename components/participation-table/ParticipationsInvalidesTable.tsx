"use client";

import React, { useState } from "react";
import { format, parseISO } from "date-fns";
import { Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

// Types
type ParticipationInvalide = {
    id: string;
    restaurant: {
        nom: string;
    } | null;
    inscription: {
        nom: string;
        prenom: string;
        email: string;
    };
    ocr_date_achat: string;
    ocr_montant: number;
    ocr_heure_achat: string;
    raison_invalide: string;
    image_url: string | null;
    created_at: string;
};

type ParticipationsInvalidesTableProps = {
    participations: ParticipationInvalide[];
    setSelectedImage: (url: string) => void;
    setIsModalOpen: (isOpen: boolean) => void;
};

export default function ParticipationsInvalidesTable({
    participations,
    setSelectedImage,
    setIsModalOpen,
}: ParticipationsInvalidesTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const totalPages = Math.ceil(participations.length / itemsPerPage);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentItems = participations.slice(startIndex, startIndex + itemsPerPage);

    const handlePrevious = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const exportToCSV = () => {
        const headers = [
            "Restaurant", 
            "Nom", 
            "Prénom", 
            "Email", 
            "Date d'achat", 
            "Heure d'achat",
            "Montant", 
            "Raison d'invalidation",
            "Date de soumission"
        ];
        
        const csvRows = participations.map((participation) => [
            `"${participation.restaurant?.nom || "Non renseigné"}"`,
            `"${participation.inscription.nom}"`,
            `"${participation.inscription.prenom}"`,
            `"${participation.inscription.email}"`,
            `"${new Date(participation.ocr_date_achat).toLocaleDateString()}"`,
            `"${participation.ocr_heure_achat || "Non renseigné"}"`,
            `"${participation.ocr_montant} €"`,
            `"${participation.raison_invalide}"`,
            `"${new Date(participation.created_at).toLocaleString()}"`
        ].join(','));

        const csv = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'participations-invalides.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    // Fonction pour obtenir la couleur selon la raison d'invalidation
    const getRaisonColor = (raison: string) => {
        if (raison.includes("doublon") || raison.includes("déjà été enregistré")) {
            return "bg-red-100 text-red-800";
        } else if (raison.includes("date") || raison.includes("période")) {
            return "bg-orange-100 text-orange-800";
        } else if (raison.includes("menu MXBO")) {
            return "bg-yellow-100 text-yellow-800";
        } else if (raison.includes("lire") || raison.includes("OCR")) {
            return "bg-blue-100 text-blue-800";
        }
        return "bg-gray-100 text-gray-800";
    };

    return (
        <div className="mb-12">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-xl font-semibold">Participations Invalides</h2>
                    <p className="text-sm text-gray-600 mt-1">
                        {participations.length} participation(s) invalide(s) trouvée(s)
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label htmlFor="itemsPerPage" className="text-sm">Lignes par page :</label>
                        <select
                            id="itemsPerPage"
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="border rounded px-2 py-1 text-sm"
                        >
                            {[5, 10, 20, 50, 100].map(n => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                    </div>
                    <Button onClick={exportToCSV} className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Exporter CSV
                    </Button>
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Restaurant
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Participant
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date/Heure
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Montant
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Raison d'invalidation
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date soumission
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ticket
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {currentItems.map((participation) => (
                                <tr key={participation.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {participation.restaurant?.nom || "Non renseigné"}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        <div>
                                            <div className="font-medium">
                                                {participation.inscription.prenom} {participation.inscription.nom}
                                            </div>
                                            <div className="text-gray-500 text-xs">
                                                {participation.inscription.email}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        <div>
                                            <div>{format(parseISO(participation.ocr_date_achat), "dd/MM/yyyy")}</div>
                                            {participation.ocr_heure_achat && (
                                                <div className="text-gray-500 text-xs">
                                                    {participation.ocr_heure_achat}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {participation.ocr_montant} €
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRaisonColor(participation.raison_invalide)}`}>
                                            {participation.raison_invalide}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {format(parseISO(participation.created_at), "dd/MM/yyyy HH:mm")}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {participation.image_url && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedImage(participation.image_url!);
                                                    setIsModalOpen(true);
                                                }}
                                                className="flex items-center gap-1 text-indigo-600 hover:text-indigo-900"
                                            >
                                                <Eye className="h-4 w-4" />
                                                Voir
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center px-4 py-3 bg-gray-50">
                    <Button
                        onClick={handlePrevious}
                        disabled={currentPage === 1}
                        variant="outline"
                        size="sm"
                    >
                        Précédent
                    </Button>

                    <span className="text-sm text-gray-700">
                        Page {currentPage} sur {totalPages} ({participations.length} total)
                    </span>

                    <Button
                        onClick={handleNext}
                        disabled={currentPage === totalPages}
                        variant="outline"
                        size="sm"
                    >
                        Suivant
                    </Button>
                </div>
            </div>
        </div>
    );
} 