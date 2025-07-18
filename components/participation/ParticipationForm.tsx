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
import { useSearchParams, useRouter } from 'next/navigation'
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
import { Check, ChevronsUpDown, Loader2, XCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import imageCompression from 'browser-image-compression'

const schema = z.object({
    ocr_restaurant: z.string().min(2, { message: 'Minimum 2 caractères requis' }),
    ocr_date_achat: z.string().min(6, { message: 'Date invalide' }),
    ocr_montant: z.string().min(1, { message: 'Montant requis' }),
    ocr_heure_achat: z.string().min(5, { message: 'Heure invalide' }).regex(/^\d{2}:\d{2}:\d{2}$/, { message: 'Format attendu HH:MM:SS' }),
    contient_menu_mxbo: z.boolean(),
    id: z.string().optional(),
})

type FormValues = z.infer<typeof schema>
type Restaurant = { id: string; nom: string; code?: string; acronym?: string }

export function ParticipationForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [image, setImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
    const [restaurants, setRestaurants] = useState<Restaurant[]>([])
    const [inscriptionId, setInscriptionId] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [showRestaurantSelect, setShowRestaurantSelect] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [open, setOpen] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [autoDetectedRestaurant, setAutoDetectedRestaurant] = useState<Restaurant | null>(null);
    const [ocrCompleted, setOcrCompleted] = useState(false);
    const { toast } = useToast()
    const [formattedMontant, setFormattedMontant] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            ocr_restaurant: '',
            ocr_date_achat: '',
            ocr_montant: '',
            ocr_heure_achat: '',
            contient_menu_mxbo: false,
            id: '',
        },
    })

    // Récupération de l'ID d'inscription
    useEffect(() => {
        const idFromUrl = searchParams.get('id')
        const idFromStorage = localStorage.getItem('inscription_id')
        const id = idFromUrl || idFromStorage

        if (id) {
            setInscriptionId(id)
        } else {
            toast({
                variant: 'default',
                duration: 5000,
                className: 'bg-[#FF0000] border-2 border-white text-white rounded-[16px] shadow-md px-4 py-3',
                description: (
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 border-2 border-[#FFB700] bg-[#FF5400] rounded-full">
                            <XCircle className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-semibold">Vous devez vous inscrire avant de participer</span>
                    </div>
                ),
            })
        }
    }, [searchParams, toast])

    // Chargement des restaurants
    useEffect(() => {
        const fetchRestaurants = async () => {
            try {
                const response = await fetch('https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/list-restaurant', {
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
                setRestaurants(data.restaurants || [])
            } catch (error) {
                toast({
                    variant: 'default',
                    duration: 5000,
                    className: 'bg-[#FF0000] border-2 border-white text-white rounded-[16px] shadow-md px-4 py-3',
                    description: (
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 border-2 border-[#FFB700] bg-[#FF5400] rounded-full">
                                <XCircle className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-semibold">Impossible de charger la liste des restaurants</span>
                        </div>
                    ),
                })
            }
        }

        fetchRestaurants()
    }, [toast])

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!inscriptionId) {
            toast({
                title: 'Erreur',
                description: 'ID utilisateur manquant',
                variant: 'destructive',
            });
            return;
        }

        if (!file.type.match(/image\/(jpeg|png|jpg)/)) {
            toast({
                title: 'Format non supporté',
                description: 'Veuillez sélectionner une image JPEG ou PNG',
                variant: 'destructive',
            });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: 'Fichier trop volumineux',
                description: 'Veuillez sélectionner une image de moins de 5MB',
                variant: 'destructive',
            });
            return;
        }

        setIsProcessing(true);
        setUploadProgress(0);
        setOcrCompleted(false);

        try {
            // 🚀 Début traitement image
            // 🖼️ Compression avec browser-image-compression
            const compressedFile = await imageCompression(file, {
                maxWidthOrHeight: 1000,
                maxSizeMB: 1,
                useWebWorker: true,
                initialQuality: 0.8,
            });

            // Prévisualisation avec l'image compressée
            const preview = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
                reader.readAsDataURL(compressedFile);
            });
            setImagePreview(preview);
            setImage(compressedFile);

            const fileExt = compressedFile.name.split('.').pop();
            const fileName = `${inscriptionId}-${Date.now()}.${fileExt}`;

            // 🔗 Étape 1 : Obtenir l'URL pré-signée
            setUploadProgress(10);
            const signedUrlRes = await fetch('https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/presigned-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: fileName,
                    type: compressedFile.type,
                }),
            });

            if (!signedUrlRes.ok) {
                throw new Error("Impossible de récupérer l'URL pré-signée");
            }

            const { uploadUrl, fileUrl } = await signedUrlRes.json();

            // 🔼 Étape 2 : Upload direct vers S3 avec retry
            setUploadProgress(20);
            const headers = {
                'Content-Type': compressedFile.type,
                
            };
            await uploadWithRetry(uploadUrl, compressedFile, (progress) => {
                setUploadProgress(20 + (progress * 0.6)); // 20% à 80%
            });

            setUploadedImageUrl(fileUrl);

            // 🧠 Étape 3 : Appel OCR avec l'URL publique
            setUploadProgress(80);
            await autoFillWithOCR(fileUrl);
            setUploadProgress(100);

            toast({
                title: 'Succès',
                description: 'Image analysée avec succès',
                variant: 'default',
            });
        } catch (error) {
            let errorMessage = "Erreur lors de l'upload";
            if (error instanceof Error) {
                if (error.message.includes('timeout')) {
                    errorMessage = "Le serveur met trop de temps à répondre. Réessayez dans quelques instants.";
                } else if (error.message.includes('Erreur réseau')) {
                    errorMessage = "Problème de connexion. Vérifiez votre réseau et réessayez.";
                } else if (error.message.includes('CORS')) {
                    errorMessage = "Erreur technique. Contactez le support.";
                } else if (error.message.includes('Upload failed')) {
                    errorMessage = "Échec de l'upload. Réessayez ou contactez le support.";
                } else {
                    errorMessage = error.message;
                }
            }
            toast({
                title: 'Erreur',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setIsProcessing(false);
        }
    };

    // 🖼️ Fonction de compression d'image optimisée pour iOS
    const compressImage = (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;
            const img = new Image();
            
            // 🔧 Correction de l'orientation pour iOS
            img.onload = () => {
                // Détecter l'orientation EXIF et corriger
                const orientation = getImageOrientation(file);
                const { width, height } = getImageDimensions(img, orientation);
                
                // Calculer les nouvelles dimensions (max 1200px)
                const maxWidth = 1200;
                const maxHeight = 1200;
                let newWidth = width;
                let newHeight = height;
                
                if (width > height) {
                    if (width > maxWidth) {
                        newHeight = (height * maxWidth) / width;
                        newWidth = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        newWidth = (width * maxHeight) / height;
                        newHeight = maxHeight;
                    }
                }
                
                canvas.width = newWidth;
                canvas.height = newHeight;
                
                // Appliquer la transformation d'orientation
                applyImageOrientation(ctx, img, orientation, newWidth, newHeight);
                
                // 🔧 Fallback pour iOS si toBlob échoue
                try {
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });
                            resolve(compressedFile);
                        } else {
                            // Fallback : utiliser l'image originale
                            resolve(file);
                        }
                    }, 'image/jpeg', 0.8);
                } catch (error) {
                    resolve(file);
                }
            };
            
            img.onerror = () => {
                resolve(file);
            };
            
            img.src = URL.createObjectURL(file);
        });
    };

    // 🔧 Fonction pour détecter l'orientation EXIF
    const getImageOrientation = (file: File): number => {
        // Par défaut, orientation normale
        return 1;
    };

    // 🔧 Fonction pour calculer les dimensions avec orientation
    const getImageDimensions = (img: HTMLImageElement, orientation: number): { width: number; height: number } => {
        if (orientation > 4 && orientation < 9) {
            return { width: img.height, height: img.width };
        }
        return { width: img.width, height: img.height };
    };

    // 🔧 Fonction pour appliquer l'orientation
    const applyImageOrientation = (
        ctx: CanvasRenderingContext2D, 
        img: HTMLImageElement, 
        orientation: number, 
        width: number, 
        height: number
    ) => {
        ctx.save();
        
        switch (orientation) {
            case 2: ctx.transform(-1, 0, 0, 1, width, 0); break;
            case 3: ctx.transform(-1, 0, 0, -1, width, height); break;
            case 4: ctx.transform(1, 0, 0, -1, 0, height); break;
            case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
            case 6: ctx.transform(0, 1, -1, 0, height, 0); break;
            case 7: ctx.transform(0, -1, -1, 0, height, width); break;
            case 8: ctx.transform(0, -1, 1, 0, 0, width); break;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        ctx.restore();
    };

    // 📤 Upload avec fetch (plus fiable sur iOS)
    const uploadWithFetch = async (
        url: string, 
        file: File, 
        onProgress: (progress: number) => void
    ): Promise<void> => {
        try {
            const headers: Record<string, string> = {
                'Content-Type': file.type,
            };
            // Ajout du Content-Length si possible
            if (typeof file.size === 'number') {
                headers['Content-Length'] = file.size.toString();
            }
            if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
                headers['Cache-Control'] = 'no-cache';
                headers['Pragma'] = 'no-cache';
            }
            const response = await fetch(url, {
                method: 'PUT',
                headers,
                body: file,
                signal: AbortSignal.timeout(120000),
            });
            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Pas de détails');
                throw new Error(`Upload failed: ${response.status} - ${response.statusText}`);
            }
            onProgress(100);
        } catch (error) {
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new Error('Upload timeout - Le serveur met trop de temps à répondre');
                } else if (error.message.includes('Failed to fetch')) {
                    throw new Error('Erreur réseau - Vérifiez votre connexion internet');
                } else if (error.message.includes('CORS')) {
                    throw new Error('Erreur de configuration serveur - Contactez le support');
                }
            }
            throw error;
        }
    };

    // 📤 Upload avec XMLHttpRequest (pour les autres navigateurs)
    const uploadWithXHR = async (
        url: string, 
        file: File, 
        onProgress: (progress: number) => void
    ): Promise<void> => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            // 🔧 Timeout plus long
            xhr.timeout = 120000; // 2 minutes
            
            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const progress = (event.loaded / event.total) * 100;
                    onProgress(progress);
                }
            });
            
            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve();
                } else {
                    const errorText = xhr.responseText || 'Pas de détails';
                    reject(new Error(`Upload failed: ${xhr.status} - ${xhr.statusText}`));
                }
            });
            
            xhr.addEventListener('error', (event) => {
                reject(new Error('Erreur réseau - Vérifiez votre connexion internet'));
            });
            
            xhr.addEventListener('timeout', () => {
                reject(new Error('Upload timeout - Le serveur met trop de temps à répondre'));
            });
            
            xhr.open('PUT', url);
            xhr.setRequestHeader('Content-Type', file.type);
            
            // 🔧 Headers supplémentaires pour éviter les problèmes CORS
            xhr.setRequestHeader('Cache-Control', 'no-cache');
            xhr.setRequestHeader('Pragma', 'no-cache');
            
            xhr.send(file);
        });
    };

    // 🔧 Fonction d'upload avec retry pour iOS
    const uploadWithRetry = async (
        url: string, 
        file: File, 
        onProgress: (progress: number) => void,
        maxRetries: number = 3
    ): Promise<void> => {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                
                if (isIOS) {
                    await uploadWithFetch(url, file, onProgress);
                } else {
                    await uploadWithXHR(url, file, onProgress);
                }
                
                return;
            } catch (error) {
                
                if (attempt === maxRetries) {
                    throw error;
                }
                
                // 🔧 Attendre avant de réessayer (délai progressif)
                const delay = 2000 * attempt; // 2s, 4s, 6s
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    };

    const findMatchingRestaurant = useCallback((restaurantName: string) => {
        if (!restaurantName) return undefined;

        // Nettoyage du nom pour une meilleure correspondance
        const cleanedInput = restaurantName.toLowerCase().trim();

        // Étape 1 : Recherche de correspondance exacte
        const exactMatch = restaurants.find(r => {
            const cleanedNom = r.nom.toLowerCase().trim();
            const cleanedCode = (r.code || '').toLowerCase().trim();
            const cleanedAcronym = (r.acronym || '').toLowerCase().trim();
            
            return (
                cleanedNom === cleanedInput ||
                cleanedCode === cleanedInput ||
                cleanedAcronym === cleanedInput
            );
        });

        if (exactMatch) {
            return exactMatch;
        }

        // Étape 2 : Si pas de correspondance exacte, recherche partielle plus stricte
        const partialMatch = restaurants.find(r => {
            const cleanedNom = r.nom.toLowerCase().trim();
            const cleanedCode = (r.code || '').toLowerCase().trim();
            const cleanedAcronym = (r.acronym || '').toLowerCase().trim();
            
            // Correspondance partielle stricte : l'input doit être contenu dans le nom/code/acronym
            // ou le nom/code/acronym doit être contenu dans l'input (pour les cas où l'OCR détecte plus de texte)
            return (
                cleanedNom.includes(cleanedInput) ||
                cleanedInput.includes(cleanedNom) ||
                cleanedCode.includes(cleanedInput) ||
                cleanedInput.includes(cleanedCode) ||
                cleanedAcronym.includes(cleanedInput) ||
                cleanedInput.includes(cleanedAcronym)
            );
        });

        return partialMatch;
    }, [restaurants]);

    // Auto-remplissage avec OCR
    const autoFillWithOCR = useCallback(async (imageUrl?: string) => {
        const urlToUse = imageUrl || uploadedImageUrl;

        if (!urlToUse) {
            throw new Error("URL de l'image manquante pour l'analyse OCR");
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
                ocr_restaurant: extracted.ocr_restaurant || '',
                ocr_date_achat: extracted.ocr_date_achat ? convertToHTMLDate(extracted.ocr_date_achat) : '',
                ocr_montant: extracted.ocr_montant ? extracted.ocr_montant.replace(',', '.').replace(/\s/g, '') : '',
                ocr_heure_achat: extracted.ocr_heure_achat || '',
                contient_menu_mxbo: extracted.contient_menu_mxbo || false,
                id: ''
            });

            if (extracted.ocr_restaurant) {
                const match = findMatchingRestaurant(extracted.ocr_restaurant);

                if (match) {
                    form.setValue('id', match.id);
                    setAutoDetectedRestaurant(match);
                    setShowRestaurantSelect(false); // Cache le sélecteur si correspondance exacte
                } else {
                    setAutoDetectedRestaurant(null);
                    setShowRestaurantSelect(true); // Affiche le sélecteur si pas de correspondance
                    setSearchTerm(extracted.ocr_restaurant);
                }
            } else {
                setAutoDetectedRestaurant(null);
                setShowRestaurantSelect(true); // Affiche le sélecteur si aucun nom détecté
                setSearchTerm('');
            }

            // Marquer l'OCR comme terminé
            setOcrCompleted(true);
        } catch (error) {
            // ✅ Enregistre la participation rejetée avec statut 'invalide' en cas d'erreur OCR
            if (uploadedImageUrl && inscriptionId) {
                const participationData = {
                    inscription_id: inscriptionId,
                    image_url: uploadedImageUrl,
                    ocr_restaurant: '',
                    ocr_date_achat: '',
                    ocr_montant: '',
                    ocr_heure_achat: '',
                    contient_menu_mxbo: false,
                    statut_validation: 'invalide',
                    raison_invalide: "Impossible de lire les informations du ticket",
                    created_at: new Date().toISOString(),
                };
                
                const { error: insertError } = await supabase.from('participation').insert([participationData]);
                if (insertError) {
                    console.error('Erreur lors de l\'enregistrement de la participation invalide:', insertError);
                }
            }
            throw error;
        } finally {
            setIsProcessing(false);
        }
    }, [uploadedImageUrl, form, findMatchingRestaurant, inscriptionId]);

    const filteredRestaurants = useMemo(() => {
        return restaurants.filter(r =>
            r.nom.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [restaurants, searchTerm])

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

    // Synchroniser le champ montant du formulaire avec le formatage à 2 décimales
    useEffect(() => {
        if (ocrCompleted) {
            const montant = form.getValues('ocr_montant');
            if (montant) {
                setFormattedMontant(parseFloat(montant).toFixed(2));
            } else {
                setFormattedMontant('');
            }
        }
    }, [ocrCompleted, form]);

    const onSubmit = async (values: FormValues) => {
        if (isSubmitting) {
            toast({
                title: 'En cours...',
                description: 'Veuillez patienter, traitement en cours.',
                variant: 'default',
            });
            return;
        }
        
        setIsSubmitting(true);
        setIsProcessing(true);
        
        try {
            // Normaliser les données pour une comparaison plus stricte
            const normalizedData = {
                ocr_restaurant: values.ocr_restaurant.trim().toLowerCase(),
                ocr_date_achat: values.ocr_date_achat,
                ocr_heure_achat: values.ocr_heure_achat,
                ocr_montant: parseFloat(values.ocr_montant).toFixed(2),
            };

            const duplicateCheck = await fetch('https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/check-duplicate-participation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(normalizedData),
            });

            if (!duplicateCheck.ok) {
                throw new Error('Erreur lors de la vérification des doublons');
            }

            const duplicateResult = await duplicateCheck.json();

            // 2. Si pas de doublon, insertion
            if (!duplicateResult.isDuplicate) {
                // ✅ Vérifie la validité de la date via l'Edge Function
                const checkRes = await fetch('https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/check-periode', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ ocr_date_achat: values.ocr_date_achat }),
                });

                if (!checkRes.ok) {
                    const result = await checkRes.json();
                    
                    // ✅ Enregistre la participation rejetée avec statut 'invalide'
                    const participationData = {
                        inscription_id: inscriptionId,
                        image_url: uploadedImageUrl,
                        ...values,
                        statut_validation: 'invalide',
                        raison_invalide: result?.error || "La date d'achat ne correspond pas à la période du jeu",
                        created_at: new Date().toISOString(),
                    };
                    
                    // Supprimer le champ id s'il existe
                    if ('id' in participationData) {
                        delete participationData.id;
                    }
                    
                    const { error: insertError } = await supabase.from('participation').insert([participationData]);
                    if (insertError) {
                        console.error('Erreur lors de l\'enregistrement de la participation invalide:', insertError);
                    }

                    toast({
                        title: 'Date invalide',
                        description: result?.error
                            ? result.error
                            : "La date d'achat ne correspond pas à la période du jeu. Veuillez vérifier votre ticket.",
                        variant: 'destructive',
                    });

                    setIsProcessing(false);
                    return;
                }

                // ✅ Enregistre la participation via la nouvelle Edge Function
                const participationPayload = {
                    inscription_id: inscriptionId,
                    image_url: uploadedImageUrl,
                    ...values,
                    statut_validation: 'validéia', // Ajout du statut pour les participations validées par l'OCR
                };

                // Juste avant l'envoi
                if ('id' in participationPayload) {
                    delete participationPayload.id;
                }

                // Dans le onSubmit, s'assurer que le montant est bien formaté à 2 décimales
                values.ocr_montant = parseFloat(values.ocr_montant).toFixed(2);

                const participationRes = await fetch('https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/participation', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(participationPayload),
                });

                if (!participationRes.ok) {
                    const error = await participationRes.json();
                    throw new Error(error.message || 'Erreur lors de l\'enregistrement');
                }

                const result = await participationRes.json();

                // On récupère l'id de participation de façon robuste
                let participationId = null;
                if (result.participation_id) {
                    participationId = result.participation_id;
                } else if (result.id) {
                    participationId = result.id;
                } else if (result.data && result.data.id) {
                    participationId = result.data.id;
                }

                // Fallback : si toujours pas d'id, on regarde dans le localStorage (rare)
                if (!participationId && typeof window !== 'undefined') {
                    participationId = localStorage.getItem('last_participation_id');
                }

                // On stocke l'id pour le cas où l'API ne le renverrait pas la prochaine fois
                if (participationId && typeof window !== 'undefined') {
                    localStorage.setItem('last_participation_id', participationId);
                }

                // ✅ Redirection ou message selon contient_menu_mxbo
                if (values.contient_menu_mxbo) {
                    // Nouvelle logique : si déjà gagné, redirige vers deja-gagne
                    if (result.result === 'Déjà joué' && result.gain === true && participationId) {
                        router.push(`/deja-gagne?id=${participationId}`)
                    } else if (participationId) {
                        router.push(`/game?id=${participationId}`);
                    } else {
                        toast({
                            title: 'Erreur',
                            description: 'Impossible de retrouver l\'identifiant de participation.',
                            variant: 'destructive',
                        });
                    }
                } else {
                    // ✅ Enregistre la participation rejetée avec statut 'invalide'
                    const participationData = {
                        inscription_id: inscriptionId,
                        image_url: uploadedImageUrl,
                        ...values,
                        statut_validation: 'invalide',
                        raison_invalide: "Votre ticket ne contient pas de Menu Best Of ou Maxi Best Of",
                        created_at: new Date().toISOString(),
                    };
                    
                    // Supprimer le champ id s'il existe
                    if ('id' in participationData) {
                        delete participationData.id;
                    }
                    
                    const { error: insertError } = await supabase.from('participation').insert([participationData]);
                    if (insertError) {
                        console.error('Erreur lors de l\'enregistrement de la participation invalide:', insertError);
                    }

                    toast({
                        title: 'Désolé',
                        description: 'Votre ticket ne contient pas de menu MXBO, vous ne pouvez pas participer au jeu',
                        variant: 'destructive',
                    });
                }

                // Reset
                form.reset({
                    ocr_restaurant: '',
                    ocr_date_achat: '',
                    ocr_montant: '',
                    ocr_heure_achat: '',
                    contient_menu_mxbo: false,
                    id: '',
                });
                setImage(null);
                setImagePreview(null);
                setUploadedImageUrl(null);
                setShowRestaurantSelect(false);
                setAutoDetectedRestaurant(null);
                setOcrCompleted(false);

            } else {
                // ✅ Enregistre la participation rejetée avec statut 'invalide'
                const participationData = {
                    inscription_id: inscriptionId,
                    image_url: uploadedImageUrl,
                    ...values,
                    statut_validation: 'invalide',
                    raison_invalide: "Un ticket avec les mêmes informations a déjà été enregistré",
                    created_at: new Date().toISOString(),
                };
                
                // Supprimer le champ id s'il existe
                if ('id' in participationData) {
                    delete participationData.id;
                }
                
                const { error: insertError } = await supabase.from('participation').insert([participationData]);
                if (insertError) {
                    console.error('Erreur lors de l\'enregistrement de la participation invalide:', insertError);
                }

                toast({
                    title: 'Ticket déjà soumis',
                    description: 'Un ticket avec les mêmes informations a déjà été enregistré.',
                    variant: 'destructive',
                });
                setIsProcessing(false);
                return;
            }

        } catch (error) {
            toast({
                title: 'Erreur',
                description: error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'enregistrement',
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
            setIsProcessing(false);
        }
    };

    return (
        <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 max-w-2xl mx-auto p-6 rounded-lg mt-10 border border-white text-black"
        >
            <h2 className="text-xl font-semibold text-center text-white ">Je tente ma chance</h2>
            <p className="text-center text-white ">Je joins une photo de mon ticket :</p>

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
                        className="cursor-pointer px-4 py-2 btn shadow  font-bold rounded-full inline-block"
                    >
                        PRENDRE UNE PHOTO
                    </label>
                </div>

                {/* Barre de progression */}
                {isProcessing && (
                    <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className="bg-[#FFB700] h-2.5 rounded-full"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                        <p className="text-xs text-right mt-1 text-white">
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
            {ocrCompleted && (
                <div className="grid gap-4 md:grid-cols-2">
                    {autoDetectedRestaurant && (
                        <div className="space-y-2">
                            <Label className="text-white" htmlFor="restaurant-name">Nom du restaurant *</Label>
                            <Input
                                id="restaurant-name"
                                {...form.register('ocr_restaurant')}
                                placeholder="Nom sur le ticket"
                                disabled
                                className="text-left"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label className="text-white" htmlFor="purchase-date">Date d'achat *</Label>
                        <Input
                            id="purchase-date"
                            type="date"
                            {...form.register('ocr_date_achat')}
                            disabled={!!autoDetectedRestaurant}
                            style={{
                                WebkitAppearance: 'none',
                                appearance: 'none'
                            }}
                            className="text-left"
                        />
                        {form.formState.errors.ocr_date_achat && (
                            <p className="text-sm text-red-500">
                                {form.formState.errors.ocr_date_achat.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-white" htmlFor="purchase-time">Heure d'achat *</Label>
                        <Input
                            id="purchase-time"
                            type="time"
                            step="1"
                            {...form.register('ocr_heure_achat')}
                            disabled={!!autoDetectedRestaurant}
                            className="text-left"
                        />
                        {form.formState.errors.ocr_heure_achat && (
                            <p className="text-sm text-red-500">
                                {form.formState.errors.ocr_heure_achat.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-white" htmlFor="amount">Montant (€) *</Label>
                        <Input
                            id="amount"
                            type="text"
                            inputMode="decimal"
                            pattern="^\\d+(\\.\\d{0,2})?$"
                            value={formattedMontant}
                            onChange={e => {
                                // Autoriser uniquement les chiffres et le point
                                const val = e.target.value.replace(/[^\d.]/g, '');
                                // Limiter à 2 décimales
                                const match = val.match(/^(\d+)(\.(\d{0,2}))?/);
                                let newValue = match ? match[0] : '';
                                setFormattedMontant(newValue);
                                form.setValue('ocr_montant', newValue, { shouldValidate: true });
                            }}
                            placeholder="0.00"
                            disabled={!!autoDetectedRestaurant}
                            className="text-left"
                        />
                        {form.formState.errors.ocr_montant && (
                            <p className="text-sm text-red-500">
                                {form.formState.errors.ocr_montant.message}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Sélection du restaurant (si non reconnu) */}
            {
                ocrCompleted && showRestaurantSelect && (
                    <div className="space-y-2">
                        <Label >Correspondance restaurant</Label>
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={open}
                                    className="w-full justify-between"
                                    type="button"
                                >
                                    {form.watch('id')
                                        ? restaurants.find((r) => r.id === form.watch('id'))?.nom
                                        : "Sélectionner un restaurant..."}
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
                                        {filteredRestaurants.map((r) => (
                                            <CommandItem
                                                key={r.id}
                                                value={r.nom}
                                                onSelect={() => {
                                                    form.setValue('id', r.id)
                                                    setOpen(false)
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        form.watch('id') === r.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {r.nom}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <p className="text-sm text-white">
                            Si le restaurant n'apparaît pas, vérifiez le nom saisi ci-dessus
                        </p>
                    </div>
                )
            }

            {/* Bouton de soumission */}
            {ocrCompleted && (
                <Button
                    type="submit"
                    className="w-full btn rounded-[60px] font-semibold transition hover:bg-[#e44f0d] disabled:opacity-60"
                    disabled={isProcessing || !image}
                >
                    {isProcessing ? (
                        <span className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Enregistrement...
                        </span>
                    ) : (
                        'Valider la participation'
                    )}
                </Button>
            )}
        </form>
    )
}