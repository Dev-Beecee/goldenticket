"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function RegistrationConsigne() {
  return (
    <div className="flex flex-col items-center gap-6 max-w-xl mx-auto text-white">
      
      {/* Première Card */}
      <Card className="border-white border bg-transparent text-center">
        <CardContent className="p-6 flex flex-col items-center gap-4">
          <p className="text-sm font-medium text-white">Du <span style={{ fontWeight: 700 }}>17 juillet au 31 août 2025</span></p>
          <h2 className="text-lg font-bold underline leading-snug text-white">
            1 Menu Best of ou Maxi Best Of acheté = 1 chance <br />
            de remporter un de nos nombreux lots
          </h2>
          <p className="text-sm text-white">
            McDonald's Guadeloupe t'offre la chance de remporter de nombreux cadeaux !
          </p>
          <a href="#form">
            <Button className="bg-yellow-400 text-purple-900 font-bold text-sm px-6 py-2 rounded-full hover:bg-yellow-300 transition" style={{ border: '1px solid white' }}>
              TENTER MA CHANCE
            </Button>
          </a>
        </CardContent>
      </Card>

      {/* Deuxième Card */}
      <Card className="border-white border bg-transparent text-left mb-[45px]">
        <CardContent className="p-6 flex flex-col gap-4">
          <h3 className="text-lg font-bold text-white text-center" style={{ fontWeight: 700, fontSize: 25 }}>Pour participer, c'est simple</h3>
          <ul className="list-disc pl-5 space-y-2 text-sm text-white">
            <li>Inscris-toi en quelques secondes.</li>
            <li>Prend en photo ton ticket de caisse prouvant l'achat de menu Best Of ou Maxi Best Of.</li>
            <li>Ton ticket sera analysé automatiquement pour t'offrir une chance de gratter le Golden Ticket !</li>
          </ul>
          <p className="text-sm font-bold text-white text-center" style={{ fontWeight: 700, fontSize: 25 }}>Attention :</p>
          <p className="text-sm text-white">
            Un ticket = une seule participation, Il ne peut être utilisé qu'une fois. <br />
            Tu peux retenter ta chance à chaque nouvel achat d'un menu Best Of ou Maxi Best Of.
          </p>
        </CardContent>
      </Card>
      <h3 className="text-sm text-white" style={{ fontWeight: 700, fontSize: 20 }}>Enregistres tes informations pour participer à la loterie</h3>
      <p className="text-sm text-white text-center mb-[30px]">En t’inscrivant ci-dessous, tes coordonnées seront utilisées pour te contacter en cas de gain.</p>
    </div>
  );
}
