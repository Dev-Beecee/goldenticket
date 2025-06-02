import { ShoppingBag } from 'lucide-react'

export function RegistrationHeader() {
  return (
    <div className="mb-8 text-center">
      <div className="flex justify-center mb-4">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <ShoppingBag className="h-8 w-8" />
        </div>
      </div>
      <h1 className="text-3xl font-bold tracking-tight mb-3">Inscription – Achat ou Remboursé</h1>
      <p className="text-muted-foreground max-w-md mx-auto">
        Complétez le formulaire ci-dessous pour participer à notre offre promotionnelle et courir la chance de vous faire rembourser votre achat.
      </p>
    </div>
  )
}