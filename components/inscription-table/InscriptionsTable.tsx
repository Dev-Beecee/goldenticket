"use client";

import React, { useState } from "react";

type Inscription = {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    created_at: string;
};

type InscriptionsTableProps = {
    inscriptions: Inscription[];
};

export default function InscriptionsTable({ inscriptions }: InscriptionsTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const totalPages = Math.ceil(inscriptions.length / itemsPerPage);

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
    };

    const handlePrevious = () => {
        if (currentPage > 1) setCurrentPage((prev) => prev - 1);
    };

    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentItems = inscriptions.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Inscriptions</h2>
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
