'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase-client'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

const schema = z.object({
    ocr_date_achat: z.string().min(6, { message: 'Date invalide' }),
    ocr_heure_achat: z.string().min(4, { message: 'Heure invalide' }),
    ocr_montant: z.string().min(1, { message: 'Montant requis' }),
    contient_menu_mxbo: z.boolean().optional(),
})

type FormValues = z.infer<typeof schema>

export function ParticipationForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [image, setImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
    const [inscriptionId, setInscriptionId] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const { toast } = useToast()

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            ocr_date_achat: '',
            ocr_heure_achat: '',
            ocr_montant: '',
            contient_menu_mxbo: false,
        },
    })

    useEffect(() => {
        const idFromUrl = searchParams.get('id')
        const idFromStorage = localStorage.getItem('inscription_id')
        const id = idFromUrl || idFromStorage

        if (id) {
            setInscriptionId(id)
            if (idFromUrl && !idFromStorage) {
                localStorage.setItem('inscription_id', idFromUrl) // ← ajoute ceci ici si tu veux
            }
        } else {
            toast({
                title: 'Erreur',
                description: 'Vous devez vous inscrire avant de participer',
                variant: 'destructive',
            })
        }
    }, [searchParams, toast])

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !inscriptionId) return

        if (!file.type.match(/image\/(jpeg|png|jpg)/)) {
            toast({
                title: 'Format non supporté',
                description: 'Veuillez sélectionner une image JPEG ou PNG',
                variant: 'destructive',
            })
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: 'Fichier trop volumineux',
                description: 'Max 5MB',
                variant: 'destructive',
            })
            return
        }

        setIsProcessing(true)
        setUploadProgress(0)

        try {
            const preview = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.onerror = () => reject(new Error('Erreur de lecture du fichier'))
                reader.readAsDataURL(file)
            })
            setImagePreview(preview)
            setImage(file)

            const fileExt = file.name.split('.').pop()
            const fileName = `${inscriptionId}-${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('tickets')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false,
                })

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('tickets')
                .getPublicUrl(fileName)

            if (!publicUrl) throw new Error('Échec de génération URL publique')

            setUploadedImageUrl(publicUrl)
            await autoFillWithOCR(publicUrl)

            toast({
                title: 'Succès',
                description: 'Image analysée avec succès',
            })

        } catch (error) {
            toast({
                title: 'Erreur',
                description: error instanceof Error ? error.message : 'Échec du traitement',
                variant: 'destructive',
            })
        } finally {
            setIsProcessing(false)
            setUploadProgress(100)
        }
    }

    const autoFillWithOCR = useCallback(async (imageUrl?: string) => {
        const urlToUse = imageUrl || uploadedImageUrl
        if (!urlToUse) throw new Error('URL de l\'image manquante pour l\'analyse OCR')

        try {
            setIsProcessing(true)
            const response = await fetch('/api/ocr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl: urlToUse }),
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`Erreur OCR: ${response.status} - ${errorText}`)
            }

            const extracted = await response.json()

            form.reset({
                ocr_date_achat: extracted.ocr_date_achat ? convertToHTMLDate(extracted.ocr_date_achat) : '',
                ocr_heure_achat: extracted.ocr_heure_achat || '',
                ocr_montant: extracted.ocr_montant?.replace(',', '.').replace(/\s/g, '') || '',
                contient_menu_mxbo: !!extracted.contient_menu_mxbo,
            })

        } catch (error) {
            throw error
        } finally {
            setIsProcessing(false)
        }
    }, [uploadedImageUrl, form])

    function convertToHTMLDate(dateStr: string): string {
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr

        const parts = dateStr.split(/[\.\/-]/)
        if (parts.length === 3) {
            const [day, month, year] = parts
            const fullYear = year.length === 2 ? `20${year}` : year
            return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        }

        return dateStr
    }

    const onSubmit = async (values: FormValues) => {
        if (!uploadedImageUrl || !inscriptionId) {
            toast({
                title: 'Erreur',
                description: 'Image ou ID manquant',
                variant: 'destructive',
            })
            return
        }

        setIsProcessing(true)

        try {
            const response = await fetch(`https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/participation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inscription_id: inscriptionId,
                    image_url: uploadedImageUrl,
                    ...values, // contient ton form.watch() (dont contient_menu_mxbo)
                    statut_validation: 'en attente',
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Échec de l\'enregistrement')
            }

            toast({
                title: 'Succès',
                description: 'Participation enregistrée',
            })

            // 🔁 Passe l'id de participation en paramètre
            router.push(`/game?id=${result.participation_id}`)

            form.reset()
            setImage(null)
            setImagePreview(null)
            setUploadedImageUrl(null)

        } catch (error) {
            toast({
                title: 'Erreur',
                description: error instanceof Error ? error.message : 'Erreur inconnue',
                variant: 'destructive',
            })
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto p-6 bg-white shadow rounded-lg mt-10">
            <h2 className="text-xl font-semibold text-center">Je tente ma chance</h2>
            <p className="text-center">Je joins une photo de mon ticket :</p>
            {/* Photo du ticket */}
            <div className="space-y-2">
                <div className="w-full flex justify-center">
                    <input
                        id="ticket-upload"
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={handleImageChange}
                        disabled={isProcessing}
                        className="hidden"
                    />

                    <label
                        htmlFor="ticket-upload"
                        className="cursor-pointer px-4 py-2 bg-white shadow text-black font-bold rounded-full inline-block"
                    >
                        SÉLECTIONNER UNE PHOTO
                    </label>
                </div>
                {isProcessing && (
                    <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className="bg-blue-600 h-2.5 rounded-full"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                        <p className="text-xs text-right mt-1">{uploadProgress}% complété</p>
                    </div>
                )}
                {imagePreview && (
                    <div className="mt-4 border rounded-md overflow-hidden">
                        <img
                            src={imagePreview}
                            alt="Aperçu du ticket"
                            className="w-full h-auto max-h-80 object-contain"
                        />
                    </div>
                )}
            </div>

            {/* Champs extraits */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label>Date d'achat *</Label>
                    <Input type="date" {...form.register('ocr_date_achat')} />
                </div>
                <div className="space-y-2">
                    <Label>Heure d'achat *</Label>
                    <Input type="time" {...form.register('ocr_heure_achat')} />
                </div>
                <div className="space-y-2">
                    <Label>Montant (€) *</Label>
                    <Input type="number" step="0.01" {...form.register('ocr_montant')} />
                </div>
            </div>

            {/* Résultat booléen */}
            <div className="space-y-2">
                <Label>MXBO ou Best Of</Label>
                <Input
                    type="text"
                    value={form.watch('contient_menu_mxbo') ? 'Oui' : 'Non'}
                    disabled
                />
            </div>

            {/* Soumission */}
            <Button type="submit" className="w-full" disabled={isProcessing || !image}>
                {isProcessing ? (
                    <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enregistrement...
                    </span>
                ) : (
                    'Tenter ma Chance'
                )}
            </Button>
        </form>
    )
}
