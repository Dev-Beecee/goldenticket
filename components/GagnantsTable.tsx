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
import { Download } from 'lucide-react'

export function GagnantsTable() {
    const [gagnants, setGagnants] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchGagnants = async () => {
            try {
                const response = await fetch('https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/get-gagnants')
                const data = await response.json()
                setGagnants(data)
            } catch (error) {
                console.error('Erreur:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchGagnants()
    }, [])

    const exportToCSV = () => {
        const headers = ['Nom', 'Prénom', 'Email', 'Téléphone', 'Lot gagné', 'Type de lot', 'Date attribution', 'Statut validation']
        const csvRows = gagnants.map(row => [
            `"${row.nom}"`,
            `"${row.prenom}"`,
            `"${row.email}"`,
            `"${row.telephone}"`,
            `"${row.lot_titre}"`,
            `"${row.type_lot_nom}"`,
            `"${row.date_attribution}"`,
            `"${row.statut_validation}"`
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

    if (loading) {
        return <div>Chargement...</div>
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Button onClick={exportToCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    Exporter en CSV
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Prénom</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Téléphone</TableHead>
                            <TableHead>Lot gagné</TableHead>
                            <TableHead>Type de lot</TableHead>
                            <TableHead>Date attribution</TableHead>

                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {gagnants.map((gagnant, index) => (
                            <TableRow key={index}>
                                <TableCell>{gagnant.nom}</TableCell>
                                <TableCell>{gagnant.prenom}</TableCell>
                                <TableCell>{gagnant.email}</TableCell>
                                <TableCell>{gagnant.telephone}</TableCell>
                                <TableCell>{gagnant.lot_titre}</TableCell>
                                <TableCell>{gagnant.type_lot_nom}</TableCell>
                                <TableCell>
                                    {new Date(gagnant.date_attribution).toLocaleString()}
                                </TableCell>

                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}