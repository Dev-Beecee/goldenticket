'use client'
import { RegistrationHeader } from '@/components/registration/RegistrationHeader'
import React, { useEffect, useState } from 'react'
import ShareButton from '@/components/ShareButton'
import { useRouter, useSearchParams } from 'next/navigation'

export default function PerduPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [inscriptionId, setInscriptionId] = useState<string | null>(null);

    useEffect(() => {
        // Récupérer l'ID depuis l'URL ou le localStorage
        const idFromUrl = searchParams.get('id')
        const idFromStorage = localStorage.getItem('inscription_id')
        const id = idFromUrl || idFromStorage
        setInscriptionId(id)
    }, [searchParams]);

    const handleRetry = () => {
      if (typeof window !== 'undefined') {
        const inscriptionId = localStorage.getItem('inscription_id');
        if (inscriptionId) {
          router.push(`/participation?id=${inscriptionId}`);
        } else {
          router.push('/');
        }
      }
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center  ">
            <RegistrationHeader />
            <div className="w-full max-w-xs text-center border border-white" style={{ borderWidth: 1, borderStyle: 'solid', borderColor: 'white', borderRadius: 16, padding: '26px 16px',  }} >
                <h1 className="text-2xl font-bold mb-4">Dommage !</h1>
                <p className="text-white font-bold mb-4">
                Malheureusement, tu n'as pas gagné cette fois, mais ne t'en fais pas…
                </p>
                <p className="text-white mb-4">
                Reviens vite dans l'un de nos restaurants pour tenter ta chance à nouveau lors de ton prochain achat.
                </p>
                <div className="flex flex-col gap-4 mt-6">
                    <button
                        className="font-bold py-2 px-4"
                        style={{ color: '#8A2E92', border: '1px solid white', borderRadius: 40, background: '#FFBC0D' }}
                        onClick={handleRetry}
                    >
                        Je tente encore ma chance
                    </button>
                    <ShareButton inscriptionId={inscriptionId || "demo"} canal="autre" shareUrl={typeof window !== 'undefined' ? window.location.origin + '/' : ''}>
                    Partager ce jeu À mes amis !
                    </ShareButton>
                </div>
            </div>
        </main>
    )
} 