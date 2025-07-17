'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'

export default function TableauRepartition({ periode_id }: { periode_id: string }) {
    const [resume, setResume] = useState([])
    const [repartitions, setRepartitions] = useState([])
    const [page, setPage] = useState(1)
    const [limit] = useState(30)
    const [loading, setLoading] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch(`https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/tableau-repartion-?periode_id=${periode_id}&page=${page}&limit=${limit}`)
            const json = await res.json()
            if (json.error) throw new Error(json.error)
            setResume(json.resume || [])
            setRepartitions(json.repartitions || [])
        } catch (err) {
            toast.error('Erreur lors du chargement')
        } finally {
            setLoading(false)
        }
    }

    const viderTable = async () => {
        if (!confirm('Confirmer la suppression ?')) return
        try {
            const res = await fetch(`https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/tableau-repartion-?periode_id=${periode_id}&reset=true`)
            const json = await res.json()
            if (json.error) throw new Error(json.error)
            toast.success('Table vidée')
            fetchData()
        } catch (err) {
            toast.error('Erreur suppression')
        }
    }

    useEffect(() => {
        if (periode_id) {
            fetchData()
        }
    }, [periode_id, page])

    return (
        <div className="space-y-6 mt-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Répartition des lots</h2>
                <Button variant="destructive" onClick={viderTable}>Vider les répartitions</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {resume.map((item: any) => (
                    <div key={item.type_lot_nom} className="bg-muted p-4 rounded-xl shadow">
                        <h3 className="font-semibold text-lg">{item.type_lot_nom}</h3>
                        <p className="text-sm text-muted-foreground">Total : {item.quantite_totale}</p>
                        <p className="text-sm text-muted-foreground">Distribué : {item.quantite_distribuee}</p>
                        <p className="text-sm text-muted-foreground">Restant : {item.quantite_restante}</p>
                    </div>
                ))}
            </div>

            <div className="border rounded-xl overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="text-black">
                            <TableHead className="text-black">Date</TableHead>
                            <TableHead className="text-black">Type de lot</TableHead>
                            <TableHead className="text-black">Lot</TableHead>
                            <TableHead className="text-black">Disponible</TableHead>
                            <TableHead className="text-black">Distribué</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {repartitions.map((r: any) => (
                            <TableRow key={r.id} className="text-black">
                                <TableCell className="text-black">{r.date_jour}</TableCell>
                                <TableCell className="text-black">{r.periode_jeu_lot.lot.type_lot.nom}</TableCell>
                                <TableCell className="text-black">{r.periode_jeu_lot.lot.titre}</TableCell>
                                <TableCell className="text-black">{r.quantite_disponible}</TableCell>
                                <TableCell className="text-black">{r.quantite_distribuee}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="flex justify-end gap-2">
                <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Précédent</Button>
                <Button variant="outline" onClick={() => setPage(page + 1)}>Suivant</Button>
            </div>
        </div>
    )
}
