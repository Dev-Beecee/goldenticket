'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

type LotType = {
    id: string
    type_valeur: string
}

export default function CreateRepartitionForm() {
    const [periodeId, setPeriodeId] = useState('')
    const [lots, setLots] = useState<LotType[]>([])
    const [quantites, setQuantites] = useState<Record<string, number>>({})
    const [loading, setLoading] = useState(false)

    // 🔁 Appel de l’Edge Function get-lots
    useEffect(() => {
        fetch('https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/get-lots')
            .then((res) => res.json())
            .then((data) => {
                setLots(data.lots)
                const initial = Object.fromEntries(data.lots.map((l: LotType) => [l.type_valeur, 0]))
                setQuantites(initial)
            })
            .catch(() => {
                toast.error("Erreur lors du chargement des types de lots")
            })
    }, [])

    const handleChange = (type: string, value: string) => {
        setQuantites((prev) => ({
            ...prev,
            [type]: parseInt(value || '0', 10),
        }))
    }

    const handleSubmit = async () => {
        if (!periodeId) {
            toast.error('Veuillez saisir un ID de période')
            return
        }

        setLoading(true)

        const payload = {
            periode_jeu_id: periodeId,
            ...Object.fromEntries(
                Object.entries(quantites).map(([k, v]) => [`nb_lots_${k}`, v])
            ),
        }

        const res = await fetch('https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/create-repartition', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })

        const json = await res.json()

        if (res.ok) {
            toast.success('Répartition créée avec succès 🎉')
        } else {
            toast.error(json.error || 'Erreur lors de la création')
        }

        setLoading(false)
    }

    return (
        <div className="max-w-xl mx-auto p-6 rounded-2xl border shadow bg-white space-y-6">
            <h2 className="text-2xl font-bold">Créer une répartition de lots</h2>

            <div>
                <Label htmlFor="periode">ID de la période</Label>
                <Input
                    id="periode"
                    value={periodeId}
                    onChange={(e) => setPeriodeId(e.target.value)}
                    placeholder="uuid de la période_jeu"
                />
            </div>

            {lots.map((lot) => (
                <div key={lot.id}>
                    <Label htmlFor={`lot-${lot.type_valeur}`}>
                        Quantité pour le lot <strong>{lot.type_valeur}</strong>
                    </Label>
                    <Input
                        id={`lot-${lot.type_valeur}`}
                        type="number"
                        min="0"
                        value={quantites[lot.type_valeur] || ''}
                        onChange={(e) => handleChange(lot.type_valeur, e.target.value)}
                    />
                </div>
            ))}

            <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Traitement en cours...' : 'Créer la répartition'}
            </Button>
        </div>
    )
}
