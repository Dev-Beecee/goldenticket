"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import jsPDF from "jspdf";
import TotalGagnantsCard from "./TotalGagnantsCard";

type StatsType = {
    participationsParRestaurant: Record<string, number>;
    participationsParTranche: Record<string, number>;
    montantMin: number;
    montantMax: number;
    restaurantMinMontant?: string;
    restaurantMaxMontant?: string;
    jourMin: string;
    jourMax: string;
    moyenneParJour: number;
    moyenneParJoueur: number;
    participationsParJour: Record<string, number>;
    utm?: {
        source: Record<string, number>;
        medium: Record<string, number>;
        campaign: Record<string, number>;
        term: Record<string, number>;
        content: Record<string, number>;
    };
    partagesParCanal?: Record<string, number>;
    tauxParticipationParJour?: Record<string, number>;
};

export default function StatisticsDashboard() {
    const [stats, setStats] = useState<StatsType | null>(null);
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const fetchStats = async () => {
        setLoading(true);

        const res = await fetch("https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/statistiques", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
            },
        });

        const json = await res.json();

        if (res.ok && json.stats) {
            setStats(json.stats);
            toast({ title: "Statistiques générées avec succès." });
        } else {
            toast({ title: "Erreur lors du chargement des statistiques", variant: "destructive" });
        }

        setLoading(false);
    };

    const exportPDF = () => {
        if (!stats) return;

        const doc = new jsPDF();
        let y = 10;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(16);
        doc.text("Statistiques du jeu", 10, y);
        y += 10;

        doc.setFontSize(12);
        doc.text(`Moyenne des participations par jour : ${stats.moyenneParJour}`, 10, y += 10);
        doc.text(`Moyenne de participations par joueur : ${stats.moyenneParJoueur}`, 10, y += 10);
        doc.text(`Jour le plus actif : ${format(new Date(stats.jourMax), 'd MMM yyyy', { locale: fr })}`, 10, y += 10);
        doc.text(`Jour le moins actif : ${format(new Date(stats.jourMin), 'd MMM yyyy', { locale: fr })}`, 10, y += 10);
        doc.text(`Montant minimum : ${stats.montantMin} € (Restaurant : ${stats.restaurantMinMontant || 'Inconnu'})`, 10, y += 10);
        doc.text(`Montant maximum : ${stats.montantMax} € (Restaurant : ${stats.restaurantMaxMontant || 'Inconnu'})`, 10, y += 10);

        y += 10;
        doc.setFontSize(14);
        doc.text("Participations par restaurant :", 10, y += 10);
        doc.setFontSize(12);
        for (const [restaurant, count] of Object.entries(stats.participationsParRestaurant)) {
            doc.text(`- ${restaurant} : ${count}`, 10, y += 6);
            if (y > 280) { doc.addPage(); y = 10; }
        }

        y += 10;
        doc.setFontSize(14);
        doc.text("Participations par jour :", 10, y += 10);
        doc.setFontSize(12);
        for (const [date, count] of Object.entries(stats.participationsParJour)) {
            doc.text(`${format(new Date(date), 'd MMM yyyy', { locale: fr })} : ${count} participations`, 10, y += 6);
            if (y > 280) { doc.addPage(); y = 10; }
        }

        y += 10;
        doc.setFontSize(14);
        doc.text("Participations par tranche de montant :", 10, y += 10);
        doc.setFontSize(12);
        for (const [tranche, count] of Object.entries(stats.participationsParTranche)) {
            doc.text(`${tranche} € : ${count} participations`, 10, y += 6);
        }

        // UTM
        if (stats.utm) {
            y += 10;
            doc.setFontSize(14);
            doc.text("Statistiques UTM :", 10, y += 10);
            doc.setFontSize(12);
            for (const [utmType, utmObj] of Object.entries(stats.utm)) {
                doc.text(`${utmType} :`, 10, y += 8);
                for (const [val, count] of Object.entries(utmObj as Record<string, number>)) {
                    doc.text(`- ${val} : ${count}`, 16, y += 6);
                    if (y > 280) { doc.addPage(); y = 10; }
                }
            }
        }

        // Partages par canal
        if (stats.partagesParCanal) {
            y += 10;
            doc.setFontSize(14);
            doc.text("Partages par canal :", 10, y += 10);
            doc.setFontSize(12);
            for (const [canal, count] of Object.entries(stats.partagesParCanal)) {
                doc.text(`- ${canal} : ${count}`, 10, y += 6);
                if (y > 280) { doc.addPage(); y = 10; }
            }
        }

        // Taux de participation par jour
        if (stats.tauxParticipationParJour) {
            y += 10;
            doc.setFontSize(14);
            doc.text("Taux de participation par jour :", 10, y += 10);
            doc.setFontSize(12);
            for (const [date, taux] of Object.entries(stats.tauxParticipationParJour)) {
                const parsedDate = new Date(date);
                const isValid = !isNaN(parsedDate.getTime());
                doc.text(`${isValid ? format(parsedDate, 'd MMM yyyy', { locale: fr }) : date} : ${taux}`, 10, y += 6);
                if (y > 280) { doc.addPage(); y = 10; }
            }
        }

        doc.save("statistiques.pdf");
    };

    return (
        <div className="space-y-8">
            {/* Section des gagnants */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Statistiques des Gagnants</h2>
                <TotalGagnantsCard />
            </div>

            <div className="flex gap-4">
                <Button onClick={fetchStats} disabled={loading}>
                    {loading ? "Chargement..." : "Afficher les statistiques"}
                </Button>
                <Button onClick={exportPDF} disabled={!stats}>
                    Exporter en PDF
                </Button>
            </div>

            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow-md p-6 space-y-2">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Résumé général</h3>
                        <p className="text-black"><strong>Moyenne par jour :</strong> {stats.moyenneParJour}</p>
                        <p className="text-black"><strong>Moyenne par joueur :</strong> {stats.moyenneParJoueur}</p>
                        <p className="text-black"><strong>Jour le plus actif :</strong> {format(new Date(stats.jourMax), 'd MMM yyyy', { locale: fr })}</p>
                        <p className="text-black"><strong>Jour le moins actif :</strong> {format(new Date(stats.jourMin), 'd MMM yyyy', { locale: fr })}</p>
                        <p className="text-black"><strong>Montant minimum :</strong> {stats.montantMin} € ({stats.restaurantMinMontant || 'Inconnu'})</p>
                        <p className="text-black"><strong>Montant maximum :</strong> {stats.montantMax} € ({stats.restaurantMaxMontant || 'Inconnu'})</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6 space-y-2">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Par tranche de montant</h3>
                        {Object.entries(stats.participationsParTranche).map(([tranche, count]) => (
                            <p className="text-black" key={tranche}>{tranche} € : {count}</p>
                        ))}
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6 space-y-2 col-span-full">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Participations par jour</h3>
                        <ul className="space-y-1 text-sm">
                            {Object.entries(stats.participationsParJour).map(([date, count]) => {
                                const parsedDate = new Date(date);
                                const isValid = !isNaN(parsedDate.getTime());

                                return (
                                    <li className="text-black" key={date}>
                                        {isValid
                                            ? format(parsedDate, 'd MMM yyyy', { locale: fr })
                                            : date} : {count} participations
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6 space-y-2 col-span-full">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Participations par restaurant</h3>
                        <ul className="space-y-1 text-sm">
                            {Object.entries(stats.participationsParRestaurant).map(([name, count]) => (
                                <li className="text-black" key={name}>{name} : {count}</li>
                            ))}
                        </ul>
                    </div>

                    {/* UTM */}
                    {stats.utm && (
                        <div className="bg-white rounded-lg shadow-md p-6 space-y-2 col-span-full">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Statistiques UTM</h3>
                            {Object.entries(stats.utm).map(([utmType, utmObj]) => (
                                <div key={utmType}>
                                    <strong className="capitalize">{utmType} :</strong>
                                    <ul className="ml-4">
                                        {Object.entries(utmObj as Record<string, number>).map(([val, count]) => (
                                            <li className="text-black" key={val}>{val} : {count}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Partages par canal */}
                    {stats.partagesParCanal && (
                        <div className="bg-white rounded-lg shadow-md p-6 space-y-2 col-span-full">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Partages par canal</h3>
                            <ul className="space-y-1 text-sm">
                                {Object.entries(stats.partagesParCanal).map(([canal, count]) => (
                                    <li className="text-black" key={canal}>{canal} : {count}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Taux de participation par jour */}
                    {stats.tauxParticipationParJour && (
                        <div className="bg-white rounded-lg shadow-md p-6 space-y-2 col-span-full">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Taux de participation par jour</h3>
                            <ul className="space-y-1 text-sm">
                                {Object.entries(stats.tauxParticipationParJour).map(([date, taux]) => {
                                    const parsedDate = new Date(date);
                                    const isValid = !isNaN(parsedDate.getTime());
                                    return (
                                        <li className="text-black" key={date}>
                                            {isValid
                                                ? format(parsedDate, 'd MMM yyyy', { locale: fr })
                                                : date} : {taux}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
