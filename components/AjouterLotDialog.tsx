'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import TypeLotManager, { TypeLot } from './TypeLotManager'

// Éditeur chargé côté client uniquement
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })
import 'react-quill/dist/quill.snow.css'

type Lot = {
    id: string
    titre: string
    photo_url: string
    type_lot_id: string
}

type AjouterLotDialogProps = {
    typesLot: TypeLot[];
    onLotAdded: () => Promise<void>;
};

export default function AjouterLotDialog({ typesLot, onLotAdded }: AjouterLotDialogProps) {
    const [open, setOpen] = useState(false)
    const [titre, setTitre] = useState('')
    const [instructions, setInstructions] = useState('')
    const [typeLotId, setTypeLotId] = useState('')
    const [typeLots, setTypeLots] = useState<TypeLot[]>([])
    const [file, setFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [lots, setLots] = useState<Lot[]>([])
    const [priorite, setPriorite] = useState(0)
    const [quantiteDisponible, setQuantiteDisponible] = useState(0)
    const [dateDistribution, setDateDistribution] = useState("")
    const [heureDistribution, setHeureDistribution] = useState("")
    const [recuperation, setRecuperation] = useState("")

    const fetchTypeLots = async () => {
        const res = await fetch('https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/type-lot')
        const json = await res.json()
        if (Array.isArray(json.data)) setTypeLots(json.data)
    }

    const fetchLots = async () => {
        const res = await fetch('https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/lots')
        const json = await res.json()
        if (json.data) setLots(Array.isArray(json.data) ? json.data : [json.data])
    }

    useEffect(() => {
        fetchTypeLots()
        fetchLots()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file || !typeLotId || !titre || !instructions || priorite === null || quantiteDisponible === null || !dateDistribution || !heureDistribution || !recuperation) {
            return alert('Tous les champs sont obligatoires')
        }
        setLoading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            const uploadRes = await fetch('https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/lots/upload', {
                method: 'POST',
                body: formData
            })
            const uploadData = await uploadRes.json()
            const photo_url = uploadData.data?.url
            if (!photo_url) throw new Error('Erreur upload image')
            const res = await fetch('https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/lots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ titre, photo_url, type_lot_id: typeLotId, instructions, priorite, quantite_disponible: quantiteDisponible, date_distribution: dateDistribution, heure_distribution: heureDistribution, recuperation })
            })
            if (!res.ok) throw new Error('Erreur création lot')
            await fetchLots()
            await onLotAdded()
            setTitre('')
            setInstructions('')
            setTypeLotId('')
            setFile(null)
            setImagePreview(null)
            setPriorite(0)
            setQuantiteDisponible(0)
            setDateDistribution("")
            setHeureDistribution("")
            setRecuperation("")
            setOpen(false)
            alert('Lot ajouté !')
        } catch (err: any) {
            alert(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0] || null;
        setFile(f);
        if (f) {
            const reader = new FileReader();
            reader.onload = (ev) => setImagePreview(ev.target?.result as string);
            reader.readAsDataURL(f);
        } else {
            setImagePreview(null);
        }
    }

    return (
        <div>
            <div className="flex justify-end mb-4">
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>Ajouter un lot</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl w-full">
                        <DialogHeader>
                            <DialogTitle>Ajouter un lot</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                            <div>
                                <Label>Titre</Label>
                                <Input value={titre} onChange={(e) => setTitre(e.target.value)} required />
                            </div>
                            
                            <div>
                                <Label>Instructions</Label>
                                <ReactQuill value={instructions} onChange={setInstructions} style={{ height: "250px" }} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4   mt-[45px]">
                                <div>
                                    <Label>Priorité</Label>
                                    <Input type="number" value={priorite} onChange={e => setPriorite(Number(e.target.value))} required min={0} />
                                </div>
                                <div>
                                    <Label>Quantité disponible</Label>
                                    <Input type="number" value={quantiteDisponible} onChange={e => setQuantiteDisponible(Number(e.target.value))} required min={0} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Date de distribution</Label>
                                    <Input type="date" value={dateDistribution} onChange={e => setDateDistribution(e.target.value)} required />
                                </div>
                                <div>
                                    <Label>Heure de distribution</Label>
                                    <Input type="time" value={heureDistribution} onChange={e => setHeureDistribution(e.target.value)} required />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Récupération</Label>
                                    <Select value={recuperation} onValueChange={setRecuperation} required>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Choisir une récupération" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="physique">Physique</SelectItem>
                                            <SelectItem value="mail">Mail</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                <Label>Type de lot</Label>
                                <div className="flex items-start gap-2">
                                    <Select value={typeLotId} onValueChange={setTypeLotId} required>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Choisir un type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {typeLots.map((type) => (
                                                <SelectItem key={type.id} value={type.id}>
                                                    {type.nom}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button type="button" variant="outline">+</Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-3xl w-full">
                                            <DialogHeader>
                                                <DialogTitle>Gérer les types de lots</DialogTitle>
                                            </DialogHeader>
                                            <TypeLotManager
                                                selectedTypeLotId={typeLotId}
                                                setSelectedTypeLotId={setTypeLotId}
                                                onChange={fetchTypeLots}
                                            />
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                            </div>
                            <div className="py-4 mt-8">
                                <Label>Image</Label>
                                <Input type="file" accept="image/*" onChange={handleFileChange} required />
                                {imagePreview && (
                                    <div className="">
                                        <img src={imagePreview} alt="Aperçu" className="max-h-48 rounded border" />
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Chargement...' : 'Ajouter'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div >
    )
}
