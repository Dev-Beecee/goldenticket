'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import './GamePage.css'

export default function GamePage() {
    const searchParams = useSearchParams()
    const [inscriptionId, setInscriptionId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [accessDenied, setAccessDenied] = useState(false)
    const containerRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        const idFromUrl = searchParams.get('id')
        const idFromStorage = localStorage.getItem('inscription_id')
        const id = idFromUrl || idFromStorage

        if (id) {
            setInscriptionId(id)
            if (idFromUrl && !idFromStorage) {
                localStorage.setItem('inscription_id', idFromUrl)
            }
        } else {
            setAccessDenied(true)
            setIsLoading(false)
        }
    }, [searchParams])

    const initScratchCard = async () => {
        if (typeof window === 'undefined') return
        if (!containerRef.current) return

        // attendre que la div soit visible pour obtenir la vraie largeur
        await new Promise((resolve) => setTimeout(resolve, 100))

        const container = containerRef.current
        if (!container || container.offsetWidth === 0) {
            alert("Erreur : la carte n'a pas pu être initialisée. Largeur invalide.")
            return
        }

        console.log('Largeur du conteneur :', container.offsetWidth)

        try {
            const { ScratchCard, SCRATCH_TYPE } = await import('scratchcard-js')

            const sc = new ScratchCard('#js--sc--container', {
                scratchType: SCRATCH_TYPE.CIRCLE,
                containerWidth: container.offsetWidth,
                containerHeight: 300,
                imageForwardSrc: '/header.png',
                imageBackgroundSrc: '/perdu.jpeg',
                htmlBackground: '',
                brushSrc: '',
                clearZoneRadius: 50,
                nPoints: 30,
                pointSize: 4,
                enabledPercentUpdate: true,
                percentToFinish: 50,
                callback: () => {
                    alert('Bravo ! Vous avez gratté assez pour révéler le résultat.')
                },
            })

            await sc.init()
            setIsLoading(false)

            sc.canvas.addEventListener('scratch.move', () => {
                const percent = sc.getPercent().toFixed(2)
                const infoDiv = document.querySelector('.sc__infos')
                if (infoDiv) {
                    infoDiv.textContent = `Progression : ${percent}%`
                }
            })
        } catch (err: any) {
            alert(`Erreur : ${err.message}`)
            setIsLoading(false)
        }
    }

    useEffect(() => {
        const participationId = searchParams.get('id')
        if (!participationId) {
            setAccessDenied(true)
            setIsLoading(false)
            return
        }

        fetch(`https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/bright-function`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ participation_id: participationId }),
        })
            .then(res => res.json())
            .then(res => {
                if (res.access === true) {
                    initScratchCard()
                } else {
                    setAccessDenied(true)
                    setIsLoading(false)
                }
            })
            .catch(() => {
                setAccessDenied(true)
                setIsLoading(false)
            })
    }, [searchParams])

    if (accessDenied) {
        return (
            <main className="min-h-screen p-6 bg-gray-50 flex items-center justify-center">
                <div className="max-w-md text-center">
                    <h1 className="text-2xl font-bold mb-4">Accès refusé</h1>
                    <p className="text-gray-600">
                        Vous devez soumettre un ticket valide contenant un menu MXBO ou Best Of pour accéder au jeu.
                    </p>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
            {isLoading ? (
                <div className="w-full max-w-xs text-center">
                    <div className="w-full bg-gray-300 rounded-full h-2.5 mb-2">
                        <div className="bg-blue-600 h-2.5 rounded-full animate-pulse w-3/4" />
                    </div>
                    <p className="text-sm text-gray-600">Chargement du jeu...</p>
                </div>
            ) : (
                <div className="sc__wrapper">
                    <div ref={containerRef} id="js--sc--container" className="sc__container" />
                    <div className="sc__infos">Progression : 0%</div>
                </div>
            )}
        </main>
    )
}
