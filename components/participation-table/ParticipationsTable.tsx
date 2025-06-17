"use client";

import React, { useState } from "react";

// Types
type Participation = {
    id: string;
    restaurant: {
        nom: string;
    };
    inscription: {
        nom: string;
        prenom: string;
        email: string;
    };
    ocr_date_achat: string;
    ocr_montant: number;
    statut_validation: string;
    image_url: string | null;
};

type ParticipationsTableProps = {
    participations: Participation[];
    updateParticipationStatus: (id: string, newStatus: string) => void;
    setSelectedImage: (url: string) => void;
    setIsModalOpen: (isOpen: boolean) => void;
};

export default function ParticipationsTable({
    participations,
    updateParticipationStatus,
    setSelectedImage,
    setIsModalOpen,
}: ParticipationsTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
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
        const headers = ["Restaurant", "Nom", "Prénom", "Email", "Date", "Montant", "Statut"];
        const csvRows = participations.map((participation) => [
            `"${participation.restaurant.nom}"`,
            `"${participation.inscription.nom}"`,
            `"${participation.inscription.prenom}"`,
            `"${participation.inscription.email}"`,
            `"${new Date(participation.ocr_date_achat).toLocaleDateString()}"`,
            `"${participation.ocr_montant} €"`,
            `"${participation.statut_validation}"`
        ].join(','));

        const csv = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'participations.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="mb-12">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Participations</h2>
                <button
                    onClick={exportToCSV}
                    className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800"
                >
                    Exporter en CSV
                </button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Restaurant</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prénom</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {currentItems.map((participation) => (
                                <tr key={participation.id}>
                                    <td className="px-6 py-4 text-sm text-gray-500">{participation.restaurant?.nom || "Non renseigné"}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{participation.inscription.nom}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{participation.inscription.prenom}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{participation.inscription.email}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(participation.ocr_date_achat).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {participation.ocr_montant} €
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        <select
                                            value={participation.statut_validation}
                                            onChange={(e) => updateParticipationStatus(participation.id, e.target.value)}
                                            className="border rounded px-2 py-1"
                                        >
                                            <option value="en attente">En attente</option>
                                            <option value="validé">Validé</option>
                                            <option value="validéia">Validé IA</option>
                                            <option value="rejeté">Rejeté</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {participation.image_url && (
                                            <button
                                                onClick={() => {
                                                    setSelectedImage(participation.image_url!);
                                                    setIsModalOpen(true);
                                                }}
                                                className="text-indigo-600 hover:text-indigo-900 underline"
                                            >
                                                Voir
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center px-4 py-3 bg-gray-50">
                    <button
                        onClick={handlePrevious}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 text-sm font-medium rounded-md ${currentPage === 1
                            ? "bg-gray-200 text-gray-500"
                            : "bg-indigo-600 text-white hover:bg-indigo-700"
                            }`}
                    >
                        Précédent
                    </button>

                    <span className="text-sm text-gray-700">
                        Page {currentPage} sur {totalPages}
                    </span>

                    <button
                        onClick={handleNext}
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 text-sm font-medium rounded-md ${currentPage === totalPages
                            ? "bg-gray-200 text-gray-500"
                            : "bg-indigo-600 text-white hover:bg-indigo-700"
                            }`}
                    >
                        Suivant
                    </button>
                </div>
            </div>
        </div>
    );
}
