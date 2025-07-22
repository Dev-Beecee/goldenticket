'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { RegistrationSuccess } from './RegistrationSuccess'

const formSchema = z.object({
  nom: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères." }),
  prenom: z.string().min(2, { message: "Le prénom doit contenir au moins 2 caractères." }),
  email: z.string().email({ message: "Veuillez saisir une adresse email valide." }),
  telephone: z.string().regex(/^(0|\+33)[1-9]([-. ]?[0-9]{2}){4}$/, {
    message: "Veuillez saisir un numéro de téléphone valide.",
  }),
  certifie_achat_menu: z.boolean().refine(val => val === true, {
    message: "Vous devez certifier l'achat d'un menu pour participer.",
  }),
  accepte_reglement: z.boolean().refine(val => val === true, {
    message: "Vous devez accepter le règlement pour participer.",
  }),
  accepte_marketing: z.boolean().default(false),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_term: z.string().optional(),
  utm_content: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>


export function RegistrationForm() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [registrationId, setRegistrationId] = useState<string | null>(null)
  const [hasParticipated, setHasParticipated] = useState<boolean>(false)
  const router = useRouter() // Déjà importé
  const searchParams = useSearchParams();

  const { toast } = useToast()


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      certifie_achat_menu: false,
      accepte_reglement: false,
      accepte_marketing: false,
      utm_source: '',
      utm_medium: '',
      utm_campaign: '',
      utm_term: '',
      utm_content: '',
    },
  })

  const isLoading = form.formState.isSubmitting

  // 🔁 Auto-remplissage depuis localStorage
  useEffect(() => {
    const storedId = localStorage.getItem('inscription_id')
    const storedData = localStorage.getItem('inscription_data')

    if (storedId) {
      setRegistrationId(storedId)

      // Vérifier si l'utilisateur existe et rediriger immédiatement
      fetch('https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/inscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ inscription_id: storedId }),
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.exists) {
            // Redirection immédiate si l'utilisateur existe déjà
            router.push(`/participation?id=${storedId}`)
            return
          }
          
          if (res.participations && res.participations.length > 0) {
            setHasParticipated(true)
          }
        })
        .catch(() => { })
    }

    if (storedData) {
      try {
        const parsed = JSON.parse(storedData)
        form.reset(parsed)
      } catch { }
    }

    // Récupération automatique des UTM depuis l'URL
    const utmFields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    utmFields.forEach(field => {
      const value = searchParams.get(field) || '';
      form.setValue(field as keyof FormValues, value);
    });
  }, [form, searchParams, router])

  // Dans la fonction onSubmit du composant RegistrationForm
  async function onSubmit(data: FormValues) {
    try {
      data.telephone = data.telephone.replace(/[\s.-]/g, '');
      const res = await fetch('https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/inscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`)
      }

      const result = await res.json()

      if (result?.data) {
        const userData = result.data[0] || result.data; // Handle both array and single object
        const id = userData.id;
        setRegistrationId(id)
        localStorage.setItem('inscription_id', id)
        localStorage.setItem('inscription_data', JSON.stringify(userData))

        if (result.exists) {
          // User already exists, show message
          toast({
            title: "Information",
            description: "Vous êtes déjà inscrit. Redirection vers la page de participation...",
            variant: "default",
          })
        }

        // Redirection vers la page de participation dans les deux cas
        setTimeout(() => {
          router.push(`/participation?id=${id}`)
        }, result.exists ? 2000 : 0)
      } else {
        throw new Error("Réponse inattendue du serveur")
      }
    } catch (err) {
      console.error('Submission error:', err)
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Une erreur est survenue",
        variant: "destructive",
      })
    }
  }

  if (isSubmitted && registrationId) {
    return <RegistrationSuccess registrationId={registrationId} />
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" id="form">
        {/* Nom & Prénom */}
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="nom"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Nom</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nom"
                    {...field}
                    className="bg-[#8A2E92] border-0 border-b border-b-white text-white placeholder:text-white/70 rounded-none"
                    autoComplete="family-name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="prenom"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Prénom</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Prénom"
                    {...field}
                    className="bg-[#8A2E92] border-0 border-b border-b-white text-white placeholder:text-white/70 rounded-none"
                    autoComplete="given-name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="votre@email.com"
                  {...field}
                  className="bg-[#8A2E92] border-0 border-b border-b-white text-white placeholder:text-white/70 rounded-none"
                  autoComplete="email"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Téléphone */}
        <FormField
          control={form.control}
          name="telephone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Téléphone</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="06 12 34 56 78"
                  {...field}
                  className="bg-[#8A2E92] border-0 border-b border-b-white text-white placeholder:text-white/70 rounded-none"
                  autoComplete="tel"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Checkboxes */}
        <div className="space-y-4">
          {/* Certifie achat menu */}
          <FormField
            control={form.control}
            name="certifie_achat_menu"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="font-normal">
                    Je certifie que ma participation fait suite à l'achat d'un Menu Best Of ou Maxi Best Of dans un restaurant McDonald's de Guadeloupe sur la période du 17 juillet au 31 août 2025.*
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
          {/* Accepte règlement */}
          <FormField
            control={form.control}
            name="accepte_reglement"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="font-normal">
                  J’accepte que mes données personnelles saisies dans le formulaire soient utilisées pour être recontacté(e) par l’entreprise dans le cadre du jeu.*                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          {/* Accepte marketing */}
          <FormField
            control={form.control}
            name="accepte_marketing"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="font-normal">
                  J’accepte que mes données personelles saisies dans le formulaire soient utilisées à des fins commerciales.
                  </FormLabel>
                  
                </div>
              </FormItem>
            )}
          />
        </div>

        {/* Bouton */}
        <Button
          type="submit"
          className={cn(
            "w-full transition-all duration-300 btn",
            isLoading ? "bg-primary/80" : "bg-primary hover:bg-primary/90"
          )}
          style={{ fontWeight: 700 }}
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {hasParticipated ? "Retenter ma chance" : "Valider mon inscription"}
         
        </Button>

        {/* Mention bas de page */}
        <p className="text-center text-xs text-white mt-4">
          * Champs obligatoires
        </p>
      </form>
    </Form>
  )
}
