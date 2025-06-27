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
    contient_menu_mxbo: z.boolean(),
    id: z.string().optional(),
})

type FormValues = z.infer<typeof schema>
type Restaurant = { id: string; nom: string }

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

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            ocr_restaurant: '',
            ocr_date_achat: '',
            ocr_montant: '',
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
            console.log('Inscription ID found:', id)
            setInscriptionId(id)
        } else {
            console.error('No inscription ID found')
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
                console.log('Fetching restaurants...')
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
                console.log('Restaurants loaded:', data.restaurants?.length || 0)
                setRestaurants(data.restaurants || [])
            } catch (error) {
                console.error('Error fetching restaurants:', error)
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
            console.log('🚀 Début traitement image');
            // 🖼️ Compression avec browser-image-compression
            const compressedFile = await imageCompression(file, {
                maxWidthOrHeight: 1000,
                maxSizeMB: 1,
                useWebWorker: true,
                initialQuality: 0.8,
            });
            console.log('📦 Image compressée:', compressedFile.size, 'bytes');

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
            console.log('🔑 Récupération URL pré-signée...');
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
            console.log('🔑 URL pré-signée obtenue');

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
            console.error('❌ Erreur upload/image:', error);
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
                            console.warn('Compression échouée, utilisation de l\'image originale');
                            resolve(file);
                        }
                    }, 'image/jpeg', 0.8);
                } catch (error) {
                    console.warn('Erreur compression, utilisation de l\'image originale:', error);
                    resolve(file);
                }
            };
            
            img.onerror = () => {
                console.warn('Erreur chargement image, utilisation de l\'originale');
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
            console.log('🔄 Début upload fetch vers:', url);
            console.log('📁 Taille fichier:', file.size, 'bytes');
            const response = await fetch(url, {
                method: 'PUT',
                headers,
                body: file,
                signal: AbortSignal.timeout(120000),
            });
            console.log('📡 Réponse upload:', response.status, response.statusText);
            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Pas de détails');
                console.error('❌ Upload failed:', response.status, errorText);
                throw new Error(`Upload failed: ${response.status} - ${response.statusText}`);
            }
            onProgress(100);
            console.log('✅ Upload fetch réussi');
        } catch (error) {
            console.error('❌ Upload fetch error:', error);
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
            
            console.log('🔄 Début upload XHR vers:', url);
            console.log('📁 Taille fichier:', file.size, 'bytes');
            
            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const progress = (event.loaded / event.total) * 100;
                    console.log(`📊 Progression: ${progress.toFixed(1)}%`);
                    onProgress(progress);
                }
            });
            
            xhr.addEventListener('load', () => {
                console.log('📡 XHR response:', xhr.status, xhr.statusText);
                if (xhr.status >= 200 && xhr.status < 300) {
                    console.log('✅ Upload XHR réussi');
                    resolve();
                } else {
                    const errorText = xhr.responseText || 'Pas de détails';
                    console.error('❌ XHR failed:', xhr.status, errorText);
                    reject(new Error(`Upload failed: ${xhr.status} - ${xhr.statusText}`));
                }
            });
            
            xhr.addEventListener('error', (event) => {
                console.error('❌ XHR error:', event);
                reject(new Error('Erreur réseau - Vérifiez votre connexion internet'));
            });
            
            xhr.addEventListener('timeout', () => {
                console.error('⏰ XHR timeout');
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
                console.log(`🔄 Tentative d'upload ${attempt}/${maxRetries}`);
                
                if (isIOS) {
                    await uploadWithFetch(url, file, onProgress);
                } else {
                    await uploadWithXHR(url, file, onProgress);
                }
                
                console.log('✅ Upload réussi');
                return;
            } catch (error) {
                console.error(`❌ Tentative ${attempt} échouée:`, error);
                
                if (attempt === maxRetries) {
                    throw error;
                }
                
                // 🔧 Attendre avant de réessayer (délai progressif)
                const delay = 2000 * attempt; // 2s, 4s, 6s
                console.log(`⏳ Attente ${delay}ms avant nouvelle tentative...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    };

    const findMatchingRestaurant = useCallback((restaurantName: string) => {
        if (!restaurantName) return undefined;

        // Nettoyage du nom pour une meilleure correspondance
        const cleanedInput = restaurantName.toLowerCase().trim();

        return restaurants.find(r => {
            const cleanedRestaurant = r.nom.toLowerCase().trim();
            // Correspondance exacte ou partielle
            return cleanedRestaurant === cleanedInput ||
                cleanedRestaurant.includes(cleanedInput) ||
                cleanedInput.includes(cleanedRestaurant);
        });
    }, [restaurants]);

    // Auto-remplissage avec OCR
    const autoFillWithOCR = useCallback(async (imageUrl?: string) => {
        const urlToUse = imageUrl || uploadedImageUrl;

        if (!urlToUse) {
            console.error('Erreur critique: uploadedImageUrl non défini');
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
                contient_menu_mxbo: extracted.contient_menu_mxbo || false,
                id: ''
            });

            if (extracted.ocr_restaurant) {
                const match = findMatchingRestaurant(extracted.ocr_restaurant);

                if (match) {
                    console.log('Match found, hiding selector');
                    form.setValue('id', match.id);
                    setAutoDetectedRestaurant(match);
                    setShowRestaurantSelect(false); // Cache le sélecteur si correspondance exacte
                } else {
                    console.log('No match found, showing selector');
                    setAutoDetectedRestaurant(null);
                    setShowRestaurantSelect(true); // Affiche le sélecteur si pas de correspondance
                    setSearchTerm(extracted.ocr_restaurant);
                }
            } else {
                console.log('No restaurant detected, showing selector');
                setAutoDetectedRestaurant(null);
                setShowRestaurantSelect(true); // Affiche le sélecteur si aucun nom détecté
                setSearchTerm('');
            }

            // Marquer l'OCR comme terminé
            setOcrCompleted(true);
        } catch (error) {
            console.error('Erreur OCR:', error);
            throw error;
        } finally {
            setIsProcessing(false);
        }
    }, [uploadedImageUrl, form, findMatchingRestaurant]);

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
                console.log('📛 Réponse Edge Function:', result);
                
                // ✅ Enregistre la participation rejetée avec statut 'invalide'
                const { error: insertError } = await supabase.from('participation').insert([
                    {
                        inscription_id: inscriptionId,
                        image_url: uploadedImageUrl,
                        ...values,
                        statut_validation: 'invalide',
                        created_at: new Date().toISOString(),
                    },
                ]);
                if (insertError) {
                    console.error('Erreur lors de l\'insertion participation invalide:', insertError);
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
            };

            // Supprimer id si vide ou non défini
            if (!participationPayload.id) {
                delete participationPayload.id;
            }

            console.log('Payload participation envoyé :', participationPayload);

            const participationRes = await fetch('https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/participation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(participationPayload),
            });

            console.log('Réponse brute de la requête participation:', participationRes);

            if (!participationRes.ok) {
                const error = await participationRes.json();
                console.error('Erreur lors de l\'enregistrement de la participation:', error);
                throw new Error(error.message || 'Erreur lors de l\'enregistrement');
            }

            const result = await participationRes.json();
            console.log('Résultat JSON de la participation:', result);

            // On récupère l'id de participation de façon robuste
            let participationId = null;
            if (result.participation_id) {
                participationId = result.participation_id;
            } else if (result.id) {
                participationId = result.id;
            } else if (result.data && result.data.id) {
                participationId = result.data.id;
            }
            console.log('Participation ID récupéré:', participationId);

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
                contient_menu_mxbo: false,
                id: '',
            });
            setImage(null);
            setImagePreview(null);
            setUploadedImageUrl(null);
            setShowRestaurantSelect(false);
            setAutoDetectedRestaurant(null);
            setOcrCompleted(false);

        } catch (error) {
            console.error('Erreur:', error);
            toast({
                title: 'Erreur',
                description: error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'enregistrement',
                variant: 'destructive'
            });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto p-6 rounded-lg mt-10">
            <h2 className="text-xl font-semibold text-center text-white">Je tente ma chance</h2>
            <p className="text-center text-white">Je joins une photo de mon ticket :</p>

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
                        className="cursor-pointer px-4 py-2 bg-white shadow text-orange-600 font-bold rounded-full inline-block"
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
                        />

                        {form.formState.errors.ocr_date_achat && (
                            <p className="text-sm text-red-500">
                                {form.formState.errors.ocr_date_achat.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-white" htmlFor="amount">Montant (€) *</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            {...form.register('ocr_montant')}
                            placeholder="0.00"
                            disabled={!!autoDetectedRestaurant}
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
                        <Label className="text-white">Correspondance restaurant</Label>
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
                        <p className="text-sm text-muted-foreground">
                            Si le restaurant n'apparaît pas, vérifiez le nom saisi ci-dessus
                        </p>
                    </div>
                )
            }

            {/* Bouton de soumission */}
            {ocrCompleted && (
                <Button
                    type="submit"
                    className="w-full bg-[#F56B29] text-white rounded-[60px] font-semibold transition hover:bg-[#e44f0d] disabled:opacity-60"
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