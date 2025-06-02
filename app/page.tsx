'use client'

import { Suspense } from 'react'
import { RegistrationForm } from '@/components/registration/RegistrationForm'
import { RegistrationHeader } from '@/components/registration/RegistrationHeader'
import { RegistrationConsigne } from '@/components/registration/RegistrationConsigne'
import { RegistrationPageSkeleton } from '@/components/registration/RegistrationPageSkeleton'

export default function Home() {
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