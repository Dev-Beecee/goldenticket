'use client'

import { useEffect } from 'react'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from '@/lib/motion'
import Link from 'next/link'

interface RegistrationSuccessProps {
  registrationId: string
}

export function RegistrationSuccess({ registrationId }: RegistrationSuccessProps) {
  useEffect(() => {
    // Scroll to top on success
    window.scrollTo(0, 0)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-green-100 shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <CheckCircle className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-green-700">Inscription réussie !</CardTitle>
          <CardDescription>
            Votre demande a bien été enregistrée sous la référence <span className="font-mono font-semibold">{registrationId.substring(0, 8)}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p>
            Nous avons envoyé un email de confirmation à l'adresse que vous avez indiquée.
            Veuillez vérifier votre boîte de réception et éventuellement vos spams.
          </p>
          <p className="text-sm text-muted-foreground">
            Conservez précieusement votre référence, elle vous sera demandée pour toute communication avec notre service client.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild className="mt-2">
            <Link href="/">Retourner à l'accueil</Link>
          </Button>
        </CardFooter>
      </Card>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          Des questions ? Contactez notre support client au <span className="font-semibold">01 23 45 67 89</span> ou par email à{' '}
          <a href="mailto:support@example.com" className="text-primary hover:underline">support@example.com</a>
        </p>
      </div>
    </motion.div>
  )
}