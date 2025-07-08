'use client'

import { Suspense, useEffect, useState } from 'react'
import { RegistrationForm } from '@/components/registration/RegistrationForm'
import { RegistrationHeader } from '@/components/registration/RegistrationHeader'
import { RegistrationConsigne } from '@/components/registration/RegistrationConsigne'
import { RegistrationPageSkeleton } from '@/components/registration/RegistrationPageSkeleton'
import { supabase } from '@/lib/supabase-client'


export default function Home() {
  const [dateDebut, setDateDebut] = useState<Date | null>(null)
  const [dateFin, setDateFin] = useState<Date | null>(null)
  const [loadingPeriode, setLoadingPeriode] = useState(true)
  

  useEffect(() => {
    const fetchPeriode = async () => {
      const { data } = await supabase
        .from('periode_jeu')
        .select('*')
        .limit(1)
        .single()

      if (data) {
        setDateDebut(new Date(data.date_debut))
        setDateFin(new Date(data.date_fin))
      }

      setLoadingPeriode(false)
    }

    fetchPeriode()
  }, [])

  const now = new Date()
  const jeuActif = dateDebut && dateFin && now >= dateDebut && now <= dateFin
  const jeuNonCommence = dateDebut && now < dateDebut
  const jeuTermine = dateFin && now > dateFin



  if (!jeuActif) {
    return (
      <div className="min-h-screen">
        <div className="container max-w-2xl mx-auto text-center">
          <RegistrationHeader />
          <div className="mt-10 p-4 bg-yellow-100 text-yellow-800 rounded-lg">
            {jeuNonCommence && <p>⏳ Le jeu n'a pas encore commencé. Reviens bientôt !</p>}
            {jeuTermine && <p>🎉 Le jeu est terminé. Merci pour votre participation !</p>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-12">
        <Suspense fallback={<RegistrationPageSkeleton />}>
          <RegistrationHeader />
          <RegistrationConsigne />
          <RegistrationForm />
        </Suspense>
      </div>
    </div>
  )
}