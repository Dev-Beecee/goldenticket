'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase-client'
import { useSearchParams } from 'next/navigation'
import {
    Command,
    CommandInput,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const schema = z.object({
    ocr_nom_boutique: z.string().min(2, { message: 'Minimum 2 caractères requis' }),
    ocr_date_achat: z.string().min(6, { message: 'Date invalide' }),
    ocr_montant: z.string().min(1, { message: 'Montant requis' }),
    boutique_id: z.string().optional(),
})

type FormValues = z.infer<typeof schema>
type Boutique = { id: string; nom: string }

export function ParticipationForm() {
    const searchParams = useSearchParams()
    const [image, setImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
    const [boutiques, setBoutiques] = useState<Boutique[]>([])
    const [inscriptionId, setInscriptionId] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [showBoutiqueSelect, setShowBoutiqueSelect] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [open, setOpen] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [autoDetectedBoutique, setAutoDetectedBoutique] = useState<Boutique | null>(null);
    const { toast } = useToast()

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            ocr_nom_boutique: '',
            ocr_date_achat: '',
            ocr_montant: '',
            boutique_id: '',
        },
    })

    // Récupération de l'ID d'inscription
    useEffect(() => {
        const idFromUrl = searchParams.get('id')
        const idFromStorage = localStorage.getItem('inscription_id')
        const id = idFromUrl || idFromStorage

        if (id) {
            console.log('Inscription ID found:', id)
            setInscriptionId(id)
        } else {
            console.error('No inscription ID found')
            toast({
                title: 'Erreur',
                description: 'Vous devez vous inscrire avant de participer',
                variant: 'destructive'
            })
        }
    }, [searchParams, toast])

    // Chargement des boutiques
    useEffect(() => {
        const fetchBoutiques = async () => {
            try {
                console.log('Fetching boutiques...')
                const response = await fetch('https://nkymassyzvfwzrjekatr.supabase.co/functions/v1/list-boutique', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json'
                    }
                })

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }

                const data = await response.json()
                console.log('Boutiques loaded:', data.boutiques?.length || 0)
                setBoutiques(data.boutiques || [])
            } catch (error) {
                console.error('Error fetching boutiques:', error)
                toast({
                    title: 'Erreur',
                    description: 'Impossible de charger la liste des boutiques',
                    variant: 'destructive'
                })
            }
        }

        fetchBoutiques()
    }, [toast])

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!inscriptionId) {
            toast({
                title: 'Erreur',
                description: 'ID utilisateur manquant',
                variant: 'destructive'
            })
            return
        }

        // Validation du fichier
        if (!file.type.match(/image\/(jpeg|png|jpg)/)) {
            toast({
                title: 'Format non supporté',
                description: 'Veuillez sélectionner une image JPEG ou PNG',
                variant: 'destructive'
            })
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: 'Fichier trop volumineux',
                description: 'Veuillez sélectionner une image de moins de 5MB',
                variant: 'destructive'
            })
            return
        }

        setIsProcessing(true)
        setUploadProgress(0)

        try {
            // 1. Prévisualisation
            const preview = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.onerror = () => reject(new Error('Erreur de lecture du fichier'))
                reader.readAsDataURL(file)
            })
            setImagePreview(preview)
            setImage(file)

            // 2. Upload vers Supabase
            const fileExt = file.name.split('.').pop()
            const fileName = `${inscriptionId}-${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('tickets')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (uploadError) throw uploadError

            // 3. Récupération URL publique
            const { data: { publicUrl } } = supabase.storage
                .from('tickets')
                .getPublicUrl(fileName)

            if (!publicUrl) throw new Error('Échec de génération URL publique')

            // 4. Mise à jour de l'état
            setUploadedImageUrl(publicUrl)

            // 5. Appel OCR avec la nouvelle URL
            await autoFillWithOCR(publicUrl)

            toast({
                title: 'Succès',
                description: 'Image analysée avec succès',
                variant: 'default'
            })

        } catch (error) {
            console.error('Erreur:', error)
            toast({
                title: 'Erreur',
                description: error instanceof Error ? error.message : 'Échec du traitement',
                variant: 'destructive'
            })
        } finally {
            setIsProcessing(false)
            setUploadProgress(100)
        }
    }
    const findMatchingBoutique = useCallback((boutiqueName: string) => {
        if (!boutiqueName) return undefined;

        // Nettoyage du nom pour une meilleure correspondance
        const cleanedInput = boutiqueName.toLowerCase().trim();

        return boutiques.find(b => {
            const cleanedBoutique = b.nom.toLowerCase().trim();
            // Correspondance exacte ou partielle
            return cleanedBoutique === cleanedInput ||
                cleanedBoutique.includes(cleanedInput) ||
                cleanedInput.includes(cleanedBoutique);
        });
    }, [boutiques]);
    // Auto-remplissage avec OCR
    const autoFillWithOCR = useCallback(async (imageUrl?: string) => {
        const urlToUse = imageUrl || uploadedImageUrl;

        if (!urlToUse) {
            console.error('Erreur critique: uploadedImageUrl non défini');
            throw new Error('URL de l\'image manquante pour l\'analyse OCR');
        }

        try {
            setIsProcessing(true);
            const response = await fetch('/api/ocr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl: urlToUse }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erreur OCR: ${response.status} - ${errorText}`);
            }

            const extracted = await response.json();

            // Validation de la réponse
            if (!extracted || typeof extracted !== 'object') {
                throw new Error('Réponse OCR invalide');
            }

            // Mise à jour du formulaire
            form.reset({
                ocr_nom_boutique: extracted.ocr_nom_boutique || '',
                ocr_date_achat: extracted.ocr_date_achat ? convertToHTMLDate(extracted.ocr_date_achat) : '',
                ocr_montant: extracted.ocr_montant ? extracted.ocr_montant.replace(',', '.').replace(/\s/g, '') : '',
                boutique_id: ''
            });

            if (extracted.ocr_nom_boutique) {
                const match = findMatchingBoutique(extracted.ocr_nom_boutique);

                if (match) {
                    console.log('Match found, hiding selector');
                    form.setValue('boutique_id', match.id);
                    setAutoDetectedBoutique(match);
                    setShowBoutiqueSelect(false); // Cache le sélecteur si correspondance exacte
                } else {
                    console.log('No match found, showing selector');
                    setAutoDetectedBoutique(null);
                    setShowBoutiqueSelect(true); // Affiche le sélecteur si pas de correspondance
                    setSearchTerm(extracted.ocr_nom_boutique);
                }
            } else {
                console.log('No boutique detected, showing selector');
                setAutoDetectedBoutique(null);
                setShowBoutiqueSelect(true); // Affiche le sélecteur si aucun nom détecté
                setSearchTerm('');
            }
        } catch (error) {
            console.error('Erreur OCR:', error);
            throw error;
        } finally {
            setIsProcessing(false);
        }
    }, [uploadedImageUrl, form, findMatchingBoutique, convertToHTMLDate]);

    // Helper functions


    const filteredBoutiques = useMemo(() => {
        return boutiques.filter(b =>
            b.nom.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [boutiques, searchTerm])

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
                variant: 'destructive'
            });
            return;
        }

        setIsProcessing(true);

        try {
            // Détermine le statut en fonction de la détection
            let statut_validation = 'en attente'; // Par défaut

            if (autoDetectedBoutique) {
                // Cas 1: Détection automatique et correspondance exacte
                statut_validation = 'validé';
            }
            // Cas 2 et 3: reste "en attente" par défaut

            const { error } = await supabase.from('participation').insert([
                {
                    inscription_id: inscriptionId,
                    image_url: uploadedImageUrl,
                    ...values,
                    statut_validation,
                    created_at: new Date().toISOString()
                }
            ]);

            if (error) throw error;

            toast({
                title: 'Succès',
                description: statut_validation === 'validé'
                    ? 'Participation validée automatiquement'
                    : 'Participation en attente de validation'
            });

            // Réinitialisation
            form.reset();
            setImage(null);
            setImagePreview(null);
            setUploadedImageUrl(null);
            setShowBoutiqueSelect(false);
            setAutoDetectedBoutique(null);

        } catch (error) {
            console.error('Erreur:', error);
            toast({
                title: 'Erreur',
                description: 'Échec de l\'enregistrement',
                variant: 'destructive'
            });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto p-6 bg-white shadow rounded-lg mt-10">
            <h2 className="text-xl font-semibold">Participer au jeu</h2>

            {/* Photo du ticket */}
            <div className="space-y-2">
                <Label htmlFor="ticket-upload">Photo du ticket *</Label>
                <Input
                    id="ticket-upload"
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleImageChange}
                    disabled={isProcessing}
                />
                <p className="text-sm text-muted-foreground">
                    Formats acceptés: JPEG, PNG (max 5MB)
                </p>

                {/* Barre de progression */}
                {isProcessing && (
                    <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className="bg-blue-600 h-2.5 rounded-full"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                        <p className="text-xs text-right mt-1">
                            {uploadProgress}% complété
                        </p>
                    </div>
                )}

                {/* Aperçu de l'image */}
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

            {/* Champs du formulaire */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="shop-name">Nom de la boutique *</Label>
                    <Input
                        id="shop-name"
                        {...form.register('ocr_nom_boutique')}
                        placeholder="Nom sur le ticket"
                    />
                    {form.formState.errors.ocr_nom_boutique && (
                        <p className="text-sm text-red-500">
                            {form.formState.errors.ocr_nom_boutique.message}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="purchase-date">Date d'achat *</Label>
                    <Input
                        id="purchase-date"
                        type="date"
                        {...form.register('ocr_date_achat')}
                    />
                    {form.formState.errors.ocr_date_achat && (
                        <p className="text-sm text-red-500">
                            {form.formState.errors.ocr_date_achat.message}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="amount">Montant (€) *</Label>
                    <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        {...form.register('ocr_montant')}
                        placeholder="0.00"
                    />
                    {form.formState.errors.ocr_montant && (
                        <p className="text-sm text-red-500">
                            {form.formState.errors.ocr_montant.message}
                        </p>
                    )}
                </div>
            </div>

            {/* Sélection de la boutique (si non reconnue) */}
            {showBoutiqueSelect && (
                <div className="space-y-2">
                    <Label>Correspondance boutique</Label>
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                className="w-full justify-between"
                                type="button"
                            >
                                {form.watch('boutique_id')
                                    ? boutiques.find((b) => b.id === form.watch('boutique_id'))?.nom
                                    : "Sélectionner une boutique..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                            <Command>
                                <CommandInput
                                    placeholder="Rechercher..."
                                    value={searchTerm}
                                    onValueChange={setSearchTerm}
                                />
                                <CommandEmpty>Aucun résultat</CommandEmpty>
                                <CommandGroup className="max-h-60 overflow-y-auto">
                                    {filteredBoutiques.map((b) => (
                                        <CommandItem
                                            key={b.id}
                                            value={b.nom}
                                            onSelect={() => {
                                                form.setValue('boutique_id', b.id)
                                                setOpen(false)
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    form.watch('boutique_id') === b.id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {b.nom}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <p className="text-sm text-muted-foreground">
                        Si la boutique n'apparaît pas, vérifiez le nom saisi ci-dessus
                    </p>
                </div>
            )}

            {/* Bouton de soumission */}
            <Button
                type="submit"
                className="w-full"
                disabled={isProcessing || !image}
            >
                {isProcessing ? (
                    <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enregistrement...
                    </span>
                ) : (
                    'Valider la participation'
                )}
            </Button>
        </form>
    )
}