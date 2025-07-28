'use client'

import { useState, useEffect } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, Filter, X, ChevronDown, ChevronUp } from 'lucide-react'

export function GagnantsTable() {
    const [gagnants, setGagnants] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [filters, setFilters] = useState({
        nomPrenom: '',
        dateDebut: '',
        dateFin: '',
        lotsSelectionnes: [] as string[],
        recuperation: 'all' // 'all', 'true', 'false'
    })
    const [showLotsDropdown, setShowLotsDropdown] = useState(false)

    useEffect(() => {
        const fetchGagnants = async () => {
            try {
                const response = await fetch('https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/get-gagnants')
                const data = await response.json()
                // Ajouter le champ recupere avec une valeur par défaut si il n'existe pas
                const gagnantsAvecRecupere = data.map((gagnant: any) => ({
                    ...gagnant,
                    recupere: gagnant.recupere !== undefined ? gagnant.recupere : false
                }))
                setGagnants(gagnantsAvecRecupere)
            } catch (error) {
                console.error('Erreur:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchGagnants()
    }, [])

    // Fermer le dropdown quand on clique à l'extérieur
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element
            if (!target.closest('.lots-dropdown')) {
                setShowLotsDropdown(false)
            }
        }

        if (showLotsDropdown) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showLotsDropdown])

    // Obtenir la liste unique des lots
    const lotsUniques = Array.from(new Set(gagnants.map(g => g.lot_titre).filter(Boolean))).sort()

    // Filtrer les données
    const filteredGagnants = gagnants.filter(gagnant => {
        const nomPrenomMatch = !filters.nomPrenom || 
            gagnant.nom?.toLowerCase().includes(filters.nomPrenom.toLowerCase()) ||
            gagnant.prenom?.toLowerCase().includes(filters.nomPrenom.toLowerCase())
        
        const lotSelectionneMatch = filters.lotsSelectionnes.length === 0 || 
            filters.lotsSelectionnes.includes(gagnant.lot_titre)
        
        const dateAttribution = new Date(gagnant.date_attribution)
        const dateDebut = filters.dateDebut ? new Date(filters.dateDebut) : null
        const dateFin = filters.dateFin ? new Date(filters.dateFin) : null
        
        const dateMatch = (!dateDebut || dateAttribution >= dateDebut) && 
                         (!dateFin || dateAttribution <= dateFin)
        
        const recuperationMatch = filters.recuperation === 'all' || 
            (filters.recuperation === 'true' && gagnant.recupere) ||
            (filters.recuperation === 'false' && !gagnant.recupere)
        
        return nomPrenomMatch && lotSelectionneMatch && dateMatch && recuperationMatch
    })

    const totalPages = Math.ceil(filteredGagnants.length / itemsPerPage)
    const paginatedGagnants = filteredGagnants.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const exportToCSV = () => {
        const headers = ['Nom', 'Prénom', 'Email', 'Téléphone', 'Lot gagné', 'Date attribution', 'Récupération']
        const csvRows = filteredGagnants.map(row => [
            `"${row.nom}"`,
            `"${row.prenom}"`,
            `"${row.email}"`,
            `"${row.telephone}"`,
            `"${row.lot_titre}"`,
            `"${row.date_attribution}"`,
            `"${row.recupere ? 'Oui' : 'Non'}"`
        ].join(','))

        const csv = [headers.join(','), ...csvRows].join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'gagnants.csv'
        a.click()
        URL.revokeObjectURL(url)
    }

    const clearFilters = () => {
        setFilters({
            nomPrenom: '',
            dateDebut: '',
            dateFin: '',
            lotsSelectionnes: [],
            recuperation: 'all'
        })
        setCurrentPage(1)
    }

    const toggleLot = (lot: string) => {
        setFilters(prev => ({
            ...prev,
            lotsSelectionnes: prev.lotsSelectionnes.includes(lot)
                ? prev.lotsSelectionnes.filter(l => l !== lot)
                : [...prev.lotsSelectionnes, lot]
        }))
        setCurrentPage(1)
    }

    const updateRecuperationStatus = async (gagnant: any, recupere: boolean) => {
        if (!gagnant.email || !gagnant.date_attribution || !gagnant.lot_titre) {
            console.error('Données manquantes pour identifier le gagnant')
            return
        }

        try {
            const requestBody = {
                email: gagnant.email,
                date_attribution: gagnant.date_attribution,
                lot_titre: gagnant.lot_titre,
                recupere: recupere
            }
            
            const response = await fetch('https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/update-recuperation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            })

            const responseData = await response.json()

            if (response.ok) {
                // Mettre à jour l'état local
                setGagnants(prev => prev.map(g => 
                    g.email === gagnant.email && 
                    g.date_attribution === gagnant.date_attribution && 
                    g.lot_titre === gagnant.lot_titre 
                        ? { ...g, recupere } 
                        : g
                ))
            } else {
                console.error('Erreur lors de la mise à jour du statut de récupération:', responseData)
            }
        } catch (error) {
            console.error('Erreur:', error)
        }
    }

    const hasActiveFilters = filters.nomPrenom || filters.dateDebut || filters.dateFin || filters.lotsSelectionnes.length > 0 || filters.recuperation !== 'all'

    if (loading) {
        return <div>Chargement...</div>
    }

    return (
        <div className="space-y-4">
            {/* Section des filtres */}
            <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="h-4 w-4" />
                    <h3 className="font-medium text-black">Filtres</h3>
                    {hasActiveFilters && (
                        <Button
                            onClick={clearFilters}
                            variant="ghost"
                            size="sm"
                            className="ml-auto text-black"
                        >
                            <X className="h-4 w-4 mr-1" />
                            Effacer les filtres
                        </Button>
                    )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                        <label htmlFor="nomPrenom" className="block text-sm font-medium mb-1 text-black">
                            Recherche nom/prénom
                        </label>
                        <Input
                            id="nomPrenom"
                            placeholder="Rechercher par nom ou prénom..."
                            value={filters.nomPrenom}
                            onChange={(e) => {
                                setFilters(prev => ({ ...prev, nomPrenom: e.target.value }))
                                setCurrentPage(1)
                            }}
                            className="text-black"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1 text-black">
                            Sélectionner des lots
                        </label>
                        <div className="relative lots-dropdown">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowLotsDropdown(!showLotsDropdown)}
                                className="w-full justify-between text-black"
                            >
                                {filters.lotsSelectionnes.length === 0 
                                    ? "Tous les lots" 
                                    : `${filters.lotsSelectionnes.length} lot(s) sélectionné(s)`
                                }
                                {showLotsDropdown ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                            
                            {showLotsDropdown && (
                                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                    <div className="p-2">
                                        {lotsUniques.map((lot) => (
                                            <div key={lot} className="flex items-center space-x-2 py-1">
                                                <Checkbox
                                                    id={`lot-${lot}`}
                                                    checked={filters.lotsSelectionnes.includes(lot)}
                                                    onCheckedChange={() => toggleLot(lot)}
                                                />
                                                <label 
                                                    htmlFor={`lot-${lot}`} 
                                                    className="text-sm text-black cursor-pointer flex-1"
                                                >
                                                    {lot}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor="dateDebut" className="block text-sm font-medium mb-1 text-black">
                            Date de début
                        </label>
                        <Input
                            id="dateDebut"
                            type="date"
                            value={filters.dateDebut}
                            onChange={(e) => {
                                setFilters(prev => ({ ...prev, dateDebut: e.target.value }))
                                setCurrentPage(1)
                            }}
                            className="text-black"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="dateFin" className="block text-sm font-medium mb-1 text-black">
                            Date de fin
                        </label>
                        <Input
                            id="dateFin"
                            type="date"
                            value={filters.dateFin}
                            onChange={(e) => {
                                setFilters(prev => ({ ...prev, dateFin: e.target.value }))
                                setCurrentPage(1)
                            }}
                            className="text-black"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="recuperation" className="block text-sm font-medium mb-1 text-black">
                            Statut de récupération
                        </label>
                        <Select
                            value={filters.recuperation}
                            onValueChange={(value) => {
                                setFilters(prev => ({ ...prev, recuperation: value }))
                                setCurrentPage(1)
                            }}
                        >
                            <SelectTrigger className="text-black">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les statuts</SelectItem>
                                <SelectItem value="true">Récupérés</SelectItem>
                                <SelectItem value="false">Non récupérés</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                
                {hasActiveFilters && (
                    <div className="mt-3 text-sm text-gray-600">
                        {filteredGagnants.length} résultat(s) trouvé(s) sur {gagnants.length} total
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center">
                <Button onClick={exportToCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    Exporter en CSV
                </Button>
                <div className="flex items-center gap-2">
                    <label htmlFor="itemsPerPage">Lignes par page :</label>
                    <select
                        id="itemsPerPage"
                        value={itemsPerPage}
                        onChange={e => {
                            setItemsPerPage(Number(e.target.value))
                            setCurrentPage(1)
                        }}
                        className="border rounded px-2 py-1"
                    >
                        {[5, 10, 20, 50, 100].map(n => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="rounded-md border">
                <Table className="text-black">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Prénom</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Téléphone</TableHead>
                            <TableHead>Lot gagné</TableHead>
                            <TableHead>Date attribution</TableHead>
                            <TableHead>Récupération</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedGagnants.map((gagnant, index) => (
                            <TableRow key={index + (currentPage - 1) * itemsPerPage}>
                                <TableCell>{gagnant.nom}</TableCell>
                                <TableCell>{gagnant.prenom}</TableCell>
                                <TableCell>{gagnant.email}</TableCell>
                                <TableCell>{gagnant.telephone}</TableCell>
                                <TableCell>{gagnant.lot_titre}</TableCell>
                                <TableCell>
                                    {new Date(gagnant.date_attribution).toLocaleString('fr-FR', {
                                        timeZone: 'America/Martinique',
                                    })}
                                </TableCell>
                                <TableCell>
                                    <Select
                                        value={gagnant.recupere ? "true" : "false"}
                                        onValueChange={(value) => {
                                            updateRecuperationStatus(gagnant, value === "true")
                                        }}
                                    >
                                        <SelectTrigger className="w-32">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="false">Non récupéré</SelectItem>
                                            <SelectItem value="true">Récupéré</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            
            {filteredGagnants.length === 0 && hasActiveFilters && (
                <div className="text-center py-8 text-gray-500">
                    Aucun résultat trouvé avec les filtres actuels
                </div>
            )}
            
            <div className="flex justify-center items-center gap-2 mt-4">
                <Button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    className="text-black hover:bg-transparent hover:text-black"
                >
                    Précédent
                </Button>
                <span className="text-black">
                    Page {currentPage} sur {totalPages}
                </span>
                <Button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    className="text-black hover:bg-transparent hover:text-black"
                >
                    Suivant
                </Button>
            </div>
        </div>
    )
}