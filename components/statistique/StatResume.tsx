"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import TotalGagnantsCard from "./TotalGagnantsCard"

type ResumeStats = {
    moyenneParJour: number
    moyenneParJoueur: number
    jourMin: string
    jourMax: string
    utm?: {
        source: Record<string, number>
        medium: Record<string, number>
        campaign: Record<string, number>
        term: Record<string, number>
        content: Record<string, number>
    }
    partagesParCanal?: Record<string, number>
    tauxParticipationParJour?: Record<string, number>
}

export default function StatResume() {
    const [stats, setStats] = useState<ResumeStats | null>(null)
    const [enAttente, setEnAttente] = useState<number | null>(null)

    useEffect(() => {
        const fetchStats = async () => {
            const res = await fetch("https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/statistiques", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
                },
            })

            const json = await res.json()

            if (res.ok && json.stats) {
                setStats({
                    moyenneParJour: json.stats.moyenneParJour,
                    moyenneParJoueur: json.stats.moyenneParJoueur,
                    jourMin: json.stats.jourMin,
                    jourMax: json.stats.jourMax,
                    utm: json.stats.utm,
                    partagesParCanal: json.stats.partagesParCanal,
                    tauxParticipationParJour: json.stats.tauxParticipationParJour,
                })
            } else {
                console.error("Erreur lors de la récupération des stats")
            }
        }

        const fetchParticipationsEnAttente = async () => {
            const res = await fetch("https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/participations-en-attente", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
                },
            })

            const json = await res.json()

            if (res.ok && typeof json.total === "number") {
                setEnAttente(json.total)
            } else {
                console.error("Erreur lors de la récupération des participations en attente")
            }
        }

        fetchStats()
        fetchParticipationsEnAttente()
    }, [])

    const isValidDate = (dateString: string) => {
        const d = new Date(dateString)
        return !isNaN(d.getTime())
    }

    if (!stats) return <p className="text-gray-600">Chargement des statistiques...</p>

    return (
        <div className="flex flex-col gap-8 mt-[45px]">
            {/* Section des gagnants */}
            <TotalGagnantsCard />
            
            {/* Ligne du haut : 4 cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white shadow-md border-none">
                    <CardHeader>
                        <CardTitle className="text-sm text-muted-foreground">Moyenne par jour</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-bold text-black">{stats.moyenneParJour}</p>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-md border-none" >
                    <CardHeader>
                        <CardTitle className="text-sm text-muted-foreground">Moyenne par joueur</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-bold text-black">{stats.moyenneParJoueur}</p>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-md border-none">
                    <CardHeader>
                        <CardTitle className="text-sm text-muted-foreground">
                            Jours les plus et les moins actifs
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-black">
                            <strong>Max :</strong>{" "}
                            {isValidDate(stats.jourMax)
                                ? format(new Date(stats.jourMax), "d MMM yyyy", { locale: fr })
                                : "-"}
                            <br />
                            <strong>Min :</strong>{" "}
                            {isValidDate(stats.jourMin)
                                ? format(new Date(stats.jourMin), "d MMM yyyy", { locale: fr })
                                : "-"}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-md border-none">
                    <CardHeader>
                        <CardTitle className="text-sm text-muted-foreground">
                            Participations en attente
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-bold text-black">
                            {enAttente !== null ? enAttente : "…"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Ligne du bas : 3 cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* UTM */}
                {stats.utm && (
                    <Card className="bg-white shadow-md border-none">
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground">Statistiques UTM</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {Object.entries(stats.utm).map(([utmType, utmObj]) => (
                                <div key={utmType} className="mb-2">
                                    <strong className="capitalize">{utmType} :</strong>
                                    <ul className="ml-4">
                                        {Object.entries(utmObj as Record<string, number>).map(([val, count]) => (
                                            <li className="text-black text-xs" key={val}>{val} : {count}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Partages par canal */}
                {stats.partagesParCanal && (
                    <Card className="bg-white shadow-md border-none">
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground">Partages par canal</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="ml-2">
                                {Object.entries(stats.partagesParCanal).map(([canal, count]) => (
                                    <li className="text-black text-xs" key={canal}>{canal} : {count}</li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                {/* Taux de participation par jour */}
                {stats.tauxParticipationParJour && (
                    <Card className="bg-white shadow-md border-none">
                        <CardHeader>
                            <CardTitle className="text-sm text-muted-foreground">Taux de participation par jour</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="ml-2">
                                {Object.entries(stats.tauxParticipationParJour).map(([date, taux]) => (
                                    <li className="text-black text-xs" key={date}>
                                        {isValidDate(date)
                                            ? format(new Date(date), "d MMM yyyy", { locale: fr })
                                            : date} : {taux}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
