'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase-client'

const PeriodeJeuForm = () => {
    const [dateDebut, setDateDebut] = useState('')
    const [dateFin, setDateFin] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchPeriode = async () => {
            const { data, error } = await supabase
                .from('periode_jeu')
                .select('*')
                .limit(1)
                .single()

            if (data) {
                setDateDebut(data.date_debut?.slice(0, 16) || '')
                setDateFin(data.date_fin?.slice(0, 16) || '')
            }

            if (error) {
                console.error('Erreur chargement période :', error.message)
            }
        }

        fetchPeriode()
    }, [])

    const handleSave = async () => {
        setLoading(true)

        const { data: existing } = await supabase
            .from('periode_jeu')
            .select('*')
            .limit(1)
            .maybeSingle()

        const payload = {
            date_debut: new Date(dateDebut).toISOString(),
            date_fin: new Date(dateFin).toISOString(),
        }

        if (existing) {
            await supabase
                .from('periode_jeu')
                .update(payload)
                .eq('id', existing.id)
        } else {
            await supabase.from('periode_jeu').insert(payload)
        }

        setLoading(false)
    }

    // ✅ Affichage en heure locale Antilles (UTC−4)
    const formatToFrench = (isoDate: string) => {
        if (!isoDate) return ''
        const date = new Date(isoDate)

        return new Intl.DateTimeFormat('fr-FR', {
            timeZone: 'America/Martinique',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date) + ' (UTC−4)'
    }

    return (
        <div className="w-full bg-white shadow-md rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Label className="text-black" htmlFor="date_debut">Date de début</Label>
                    <Input
                        id="date_debut"
                        type="datetime-local"
                        value={dateDebut}
                        onChange={(e) => setDateDebut(e.target.value)}
                        className="bg-white text-black"
                    />
                    {dateDebut && (
                        <p className="text-sm text-muted-foreground mt-1">
                            {formatToFrench(dateDebut)}
                        </p>
                    )}
                </div>

                <div>
                    <Label className="text-black" htmlFor="date_fin">Date de fin</Label>
                    <Input
                        id="date_fin"
                        type="datetime-local"
                        value={dateFin}
                        onChange={(e) => setDateFin(e.target.value)}
                        className="bg-white text-black"
                    />
                    {dateFin && (
                        <p className="text-sm text-muted-foreground mt-1">
                            {formatToFrench(dateFin)}
                        </p>
                    )}
                </div>
            </div>

            <div className="mt-6">
                <Button onClick={handleSave} disabled={loading}>
                    {loading ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
            </div>
        </div>
    )
}

export default PeriodeJeuForm
