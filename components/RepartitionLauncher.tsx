'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

type TypeLot = {
    id: string
    nom: string
    priorite: number
}

type Props = {
    periode_id: string
}

export default function RepartitionLauncher({ periode_id }: Props) {
    const [typesLot, setTypesLot] = useState<TypeLot[]>([])
    const [quantites, setQuantites] = useState<Record<string, number>>({})
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchTypes = async () => {
            const res = await fetch('https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/type-lot')
            const { data } = await res.json()

            if (Array.isArray(data)) {
                const sorted = data.sort((a, b) => a.priorite - b.priorite)
                setTypesLot(sorted)

                const initialQuantites = Object.fromEntries(
                    sorted.map((t: TypeLot) => [t.nom.trim().toLowerCase(), 0])
                )
                setQuantites(initialQuantites)
            }
        }

        fetchTypes()
    }, [])

    const handleChangeQuantite = (rawNom: string, value: number) => {
        const cleaned = rawNom.trim().toLowerCase()
        setQuantites((prev) => ({
            ...prev,
            [cleaned]: value,
        }))
    }

    const handleSubmit = async () => {
        setLoading(true)

        try {
            const payload = {
                periode_jeu_id: periode_id,
                ...quantites,
            }

            const res = await fetch(
                'https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/create-repartition',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                }
            )

            const json = await res.json()

            if (!res.ok) throw new Error(json.error || 'Erreur serveur')
            toast.success('Répartition créée avec succès')
        } catch (error) {
            console.error(error)
            toast.error('Échec de la répartition')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md space-y-4">
            <h2 className="text-lg font-semibold text-black">Répartition des lots</h2>

            <p className="text-sm text-muted-foreground">
                Saisis le nombre de lots à répartir pour chaque type. La répartition sera générée
                automatiquement sur la période active.
            </p>

            {typesLot.map((type) => {
                const key = type.nom.trim().toLowerCase()
                return (
                    <div key={key}>
                        <Label>Quantité pour les lots "{type.nom}"</Label>
                        <Input
                            type="number"
                            min="0"
                            value={quantites[key] ?? 0}
                            onChange={(e) =>
                                handleChangeQuantite(type.nom, parseInt(e.target.value))
                            }
                            className="w-32"
                        />
                    </div>
                )
            })}

            <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Répartition en cours...' : 'Lancer la répartition'}
            </Button>
        </div>
    )
}
