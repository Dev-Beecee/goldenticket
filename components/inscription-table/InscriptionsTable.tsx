"use client";

import React, { useState } from "react";

type Inscription = {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    created_at: string;
    participationsCount: number;
    partagesCount?: number;
};

type InscriptionsTableProps = {
    inscriptions: Inscription[];
};

export default function InscriptionsTable({ inscriptions }: InscriptionsTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const totalPages = Math.ceil(inscriptions.length / itemsPerPage);

    // Calcul du total des participations (tous utilisateurs)
    const totalParticipations = inscriptions.reduce((acc, insc) => acc + (insc.participationsCount || 0), 0);

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
    };

    const handlePrevious = () => {
        if (currentPage > 1) setCurrentPage((prev) => prev - 1);
    };

    const exportToCSV = () => {
        const headers = ["Nom", "Prénom", "Email", "Téléphone", "Date d'inscription", "Participations", "Partages"];
        const csvRows = inscriptions.map((inscription) => [
            `"${inscription.nom}"`,
            `"${inscription.prenom}"`,
            `"${inscription.email}"`,
            `"${inscription.telephone}"`,
            `"${new Date(inscription.created_at).toLocaleDateString()}"`,
            `"${inscription.participationsCount}"`,
            `"${inscription.partagesCount ?? 0}"`,
        ].join(','));

        const csv = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'inscriptions.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentItems = inscriptions.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Inscriptions</h2>
                <button
                    onClick={exportToCSV}
                    className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-black"
                >
                    Exporter en CSV
                </button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prénom</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participations</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Partages</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Participation</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {currentItems.map((inscription) => (
                                <tr key={inscription.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inscription.nom}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inscription.prenom}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inscription.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inscription.telephone}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(inscription.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                        {inscription.participationsCount}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                        {inscription.partagesCount ?? 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                        {totalParticipations > 0
                                            ? ((inscription.participationsCount / totalParticipations) * 100).toFixed(1) + ' %'
                                            : '0 %'}
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
                            ? "bg-gray-200 text-black"
                            : "bg-indigo-600 text-black hover:bg-indigo-600"
                            }`}
                    >
                        Précédent
                    </button>

                    <span className="text-sm text-black">
                        Page {currentPage} sur {totalPages}
                    </span>

                    <button
                        onClick={handleNext}
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 text-sm font-medium rounded-md ${currentPage === totalPages
                            ? "bg-gray-200 text-black"
                            : "bg-indigo-600 text-black hover:bg-indigo-600"
                            }`}
                    >
                        Suivant
                    </button>
                </div>
            </div>
        </div>
    );
}