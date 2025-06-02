'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

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
  accepte_reglement: z.boolean().refine(val => val === true, {
    message: "Vous devez accepter le règlement pour participer.",
  }),
  accepte_marketing: z.boolean().default(false),
})

type FormValues = z.infer<typeof formSchema>


export function RegistrationForm() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [registrationId, setRegistrationId] = useState<string | null>(null)
  const [hasParticipated, setHasParticipated] = useState<boolean>(false)
  const router = useRouter() // Déjà importé

  const { toast } = useToast()


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      accepte_reglement: false,
      accepte_marketing: false,
    },
  })

  const isLoading = form.formState.isSubmitting

  // 🔁 Auto-remplissage depuis localStorage
  useEffect(() => {
    const storedId = localStorage.getItem('inscription_id')
    const storedData = localStorage.getItem('inscription_data')

    if (storedId) {
      setRegistrationId(storedId)

      // Vérifier la participation
      fetch('https://nkymassyzvfwzrjekatr.supabase.co/functions/v1/participation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ inscription_id: storedId }),
      })
        .then((res) => res.json())
        .then((res) => {
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
  }, [form])

  // Dans la fonction onSubmit du composant RegistrationForm
  async function onSubmit(data: FormValues) {
    try {
      const res = await fetch('https://nkymassyzvfwzrjekatr.supabase.co/functions/v1/inscription', {
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Nom & Prénom */}
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="nom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nom"
                    {...field}
                    className="bg-white"
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
                <FormLabel>Prénom</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Prénom"
                    {...field}
                    className="bg-white"
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
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="votre@email.com"
                  {...field}
                  className="bg-white"
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
              <FormLabel>Téléphone</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="06 12 34 56 78"
                  {...field}
                  className="bg-white"
                  autoComplete="tel"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Checkboxes */}
        <div className="space-y-4">
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
                    J'accepte le règlement et que mes données soient utilisées dans le cadre du jeu concours *
                  </FormLabel>
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
                    J'accepte que mes données soient utilisées à des fins commerciales
                  </FormLabel>
                  <FormDescription>
                    Nous respectons votre vie privée et ne partagerons jamais vos informations avec des tiers.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        {/* Bouton */}
        <Button
          type="submit"
          className={cn(
            "w-full transition-all duration-300",
            isLoading ? "bg-primary/80" : "bg-primary hover:bg-primary/90"
          )}
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {hasParticipated ? "Retenter ma chance" : "Valider mon inscription"}
        </Button>

        {/* Mention bas de page */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          * Champs obligatoires
        </p>
      </form>
    </Form>
  )
}
