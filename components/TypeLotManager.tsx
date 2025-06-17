'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export type TypeLot = {
    id: string
    nom: string
    priorite: number
}

type Props = {
    onChange?: () => void
    selectedTypeLotId: string
    setSelectedTypeLotId: (id: string) => void
}

export default function TypeLotManager({
    onChange,
    selectedTypeLotId,
    setSelectedTypeLotId
}: Props) {
    const [typeLots, setTypeLots] = useState<TypeLot[]>([])
    const [newTypeNom, setNewTypeNom] = useState('')
    const [newPriorite, setNewPriorite] = useState<number>(1)

    const fetchTypeLots = async () => {
        try {
            const res = await fetch('https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/type-lot')
            const json = await res.json()
            if (Array.isArray(json.data)) {
                const sorted = json.data.sort((a: TypeLot, b: TypeLot) => a.priorite - b.priorite)
                setTypeLots(sorted)
            } else {
                setTypeLots([])
            }
        } catch (err) {
            console.error('Erreur chargement type_lot :', err)
            setTypeLots([])
        }
    }

    useEffect(() => {
        fetchTypeLots()
    }, [])

    const handleCreateTypeLot = async () => {
        if (!newTypeNom.trim()) return
        const res = await fetch('https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/type-lot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nom: newTypeNom, priorite: newPriorite })
        })
        const json = await res.json()
        if (res.ok && json.data?.id) {
            await fetchTypeLots()
            setSelectedTypeLotId(json.data.id)
            setNewTypeNom('')
            setNewPriorite(1)
            onChange?.()
        } else {
            alert(json.error || 'Erreur lors de la création du type')
        }
    }

    const handleDeleteTypeLot = async (id: string) => {
        if (!confirm('Supprimer ce type ?')) return
        const res = await fetch(`https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/type-lot?id=${id}`, {
            method: 'DELETE'
        })
        if (res.ok) {
            await fetchTypeLots()
            if (selectedTypeLotId === id) setSelectedTypeLotId('')
            onChange?.()
        }
    }

    return (
        <div className="grid gap-2">
            <Label>Nom du type</Label>
            <Input
                placeholder="Nouveau type"
                value={newTypeNom}
                onChange={(e) => setNewTypeNom(e.target.value)}
            />

            <Label>Priorité (1 = le plus prioritaire)</Label>
            <Input
                type="number"
                min="1"
                value={newPriorite}
                onChange={(e) => setNewPriorite(parseInt(e.target.value))}
            />

            <Button type="button" onClick={handleCreateTypeLot}>
                Ajouter
            </Button>

            <p className="text-xs text-muted-foreground mt-1">
                La priorité permet de déterminer dans quel ordre les types de lots seront répartis pendant la période de jeu. Une priorité <strong>1</strong> signifie que ce type sera <strong>attribué en premier</strong>.
            </p>

            <div className="mt-3 border-t pt-3 space-y-1 text-sm">
                {typeLots.map((t) => (
                    <div key={t.id} className="flex justify-between items-center">
                        <span>
                            {t.nom} (Priorité {t.priorite})
                        </span>
                        <button
                            onClick={() => handleDeleteTypeLot(t.id)}
                            className="text-red-500"
                        >
                            Supprimer
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
