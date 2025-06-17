'use client'
import { useState } from 'react'
import { MultiSelect } from 'react-multi-select-component'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface Boutique {
    id: string
    nom: string
}

interface Winner {
    id: string
    nom: string
    prenom: string
    email: string
    telephone: string
    boutique_nom: string
    ocr_montant: number
}

interface TirageAuSortProps {
    boutiques: Boutique[]
    participations: any[]
}

export function TirageAuSort({ boutiques, participations }: TirageAuSortProps) {
    const [selectedBoutiques, setSelectedBoutiques] = useState<{ value: string, label: string }[]>([])
    const [numberOfWinners, setNumberOfWinners] = useState<number>(1)
    const [minAmount, setMinAmount] = useState<number>(0)
    const [isLoading, setIsLoading] = useState(false)
    const [winners, setWinners] = useState<Winner[]>([])
    const { toast } = useToast()

    // Convertir les données en CSV
    const convertToCSV = (data: Winner[]) => {
        const headers = ['Nom', 'Prénom', 'Email', 'Téléphone', 'Boutique', 'Montant'];
        const rows = data.map(winner => [
            `"${winner.nom}"`,
            `"${winner.prenom}"`,
            `"${winner.email}"`,
            `"${winner.telephone}"`,
            `"${winner.boutique_nom}"`,
            winner.ocr_montant.toString()
        ]);

        return [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
    };

    // Télécharger le CSV
    const downloadCSV = (data: Winner[]) => {
        const csvContent = convertToCSV(data);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `tirage_au_sort_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Filtrer les boutiques avec participations validées
    const validBoutiques = participations
        .filter(p => p.statut_validation === 'validé' && p.boutique_id)
        .reduce((acc: { id: string, nom: string, count: number }[], p) => {
            if (!acc.some(b => b.id === p.boutique_id)) {
                acc.push({
                    id: p.boutique_id,
                    nom: p.boutique?.nom || `Boutique ${p.boutique_id}`,
                    count: participations.filter(part =>
                        part.boutique_id === p.boutique_id &&
                        part.statut_validation === 'validé'
                    ).length
                })
            }
            return acc
        }, [])

    // Options pour le multiselect
    const boutiqueOptions = [
        { value: 'all', label: `Toutes les boutiques (${validBoutiques.length})` },
        ...validBoutiques.map(b => ({
            value: b.id,
            label: `${b.nom} (${b.count} participation${b.count > 1 ? 's' : ''})`
        }))
    ]

    // Gérer la sélection des boutiques
    const handleBoutiqueChange = (selected: { value: string, label: string }[]) => {
        const allSelected = selected.some(item => item.value === 'all')
        setSelectedBoutiques(allSelected ? [{ value: 'all', label: `Toutes les boutiques (${validBoutiques.length})` }] : selected)
    }

    // Effectuer le tirage au sort
    const handleDraw = async () => {
        if (numberOfWinners < 1) {
            toast({
                title: 'Erreur',
                description: 'Le nombre de gagnants doit être au moins 1',
                variant: 'destructive'
            })
            return
        }

        setIsLoading(true)

        try {
            const boutiqueIds = selectedBoutiques.some(b => b.value === 'all')
                ? 'all'
                : selectedBoutiques.map(b => b.value)

            const response = await fetch('https://nkymassyzvfwzrjekatr.supabase.co/functions/v1/tirage-au-sort', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    numberOfWinners,
                    boutiqueIds,
                    minAmount: minAmount || undefined
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors du tirage')
            }

            if (data.winners.length === 0) {
                toast({
                    title: 'Aucun gagnant',
                    description: 'Aucun participant ne correspond aux critères',
                    variant: 'destructive'
                })
                return
            }

            setWinners(data.winners)
            toast({
                title: 'Tirage effectué',
                description: `${data.winners.length} gagnant(s) sélectionné(s) parmi ${data.totalParticipants} participants`
            })

        } catch (error) {
            console.error('Erreur lors du tirage:', error)
            toast({
                title: 'Erreur',
                description: error instanceof Error ? error.message : 'Erreur inconnue',
                variant: 'destructive'
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="grid gap-6 mt-8 p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold text-black">Tirage au sort</h2>

            {/* Sélection des boutiques */}
            <div>
                <Label className="text-black" htmlFor="boutiques">Boutiques participantes</Label>
                <MultiSelect
                    options={boutiqueOptions}
                    value={selectedBoutiques}
                    onChange={handleBoutiqueChange}
                    labelledBy="Sélectionner des boutiques"
                    className="mt-2 text-black text-black"
                    valueRenderer={(selected) => (
                        <div className="truncate">
                            {selected.length === 0
                                ? "Sélectionnez des boutiques..."
                                : selected.length === 1
                                    ? selected[0].label
                                    : `${selected.length} boutiques sélectionnées`}
                        </div>
                    )}
                    overrideStrings={{
                        selectSomeItems: "Sélectionner des boutiques...",
                        allItemsAreSelected: "Toutes les boutiques sélectionnées",
                        selectAll: "Tout sélectionner",
                        search: "Rechercher...",
                    }}
                />
            </div>

            {/* Nombre de gagnants */}
            <div>
                <Label className="text-black " htmlFor="winners">Nombre de gagnants</Label>
                <Input
                    id="winners"
                    type="number"
                    min="1"
                    value={numberOfWinners}
                    onChange={(e) => setNumberOfWinners(Math.max(1, parseInt(e.target.value) || 1))}
                    className="mt-2 w-32 text-black bg-white"
                />
            </div>

            {/* Montant minimum */}
            <div>
                <Label className="text-black " htmlFor="amount">Montant minimum d'achat (optionnel)</Label>
                <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={minAmount}
                    onChange={(e) => setMinAmount(parseFloat(e.target.value) || 0)}
                    className="mt-2 w-32 text-black bg-white"
                />
            </div>

            {/* Bouton de tirage */}
            <Button
                onClick={handleDraw}
                disabled={isLoading || selectedBoutiques.length === 0}
                className="w-fit bg-black text-white"
            >
                {isLoading ? 'Tirage en cours...' : 'Effectuer le tirage'}
            </Button>

            {/* Résultats */}
            {winners.length > 0 && (
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold text-black">Résultats du tirage</h3>
                        <Button
                            onClick={() => downloadCSV(winners)}
                            variant="outline"
                            className="ml-4 bg-black text-white"
                        >
                            Exporter en CSV
                        </Button>
                    </div>
                    <div className="border rounded-lg overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Boutique</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {winners.map((winner, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-2 whitespace-nowrap">{winner.prenom} {winner.nom}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">{winner.email}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">{winner.telephone}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">{winner.boutique_nom}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">{winner.ocr_montant} €</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}