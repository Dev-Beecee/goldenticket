'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import './GamePage.css'

export default function GamePage() {
    const searchParams = useSearchParams()
    const containerRef = useRef<HTMLDivElement | null>(null)

    const [inscriptionId, setInscriptionId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [accessDenied, setAccessDenied] = useState(false)
    const [scratchReady, setScratchReady] = useState(false)


    // Récupération de l'ID
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

    // Vérification API
    useEffect(() => {
        console.log('🔍 Vérification API lancée...')
        const participationId = searchParams.get('id')
        if (!participationId) return

        fetch('https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/bright-function', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participation_id: participationId }),
        })
            .then(res => res.json())
            .then(res => {
                console.log('✅ Réponse API =', res)
                if (res.access === true) {
                    // Tout est OK, on attend le containerRef pour init scratch
                } else {
                    console.log('❌ Accès refusé par l’API')
                    setAccessDenied(true)
                    setIsLoading(false)
                }
            })
            .catch(err => {
                console.error('❌ Erreur API :', err)
                setAccessDenied(true)
                setIsLoading(false)
            })
    }, [searchParams])

    // Initialisation ScratchCard
    useEffect(() => {
        if (!scratchReady) return

        console.log('🧩 scratchReady = true → lancement de initScratchCard()')

        const init = async () => {
            console.log('🎯 initScratchCard appelé')
            try {
                const container = containerRef.current
                if (!container) throw new Error('Conteneur null')

                const { ScratchCard, SCRATCH_TYPE } = await import('scratchcard-js')

                const sc = new ScratchCard('#js--sc--container', {
                    scratchType: SCRATCH_TYPE.CIRCLE,
                    containerWidth: container.offsetWidth,
                    containerHeight: 300,
                    imageForwardSrc: '/header.png',
                    imageBackgroundSrc: '/perdu.jpeg',
                    htmlBackground: '',
                    brushSrc: '/perdu.jpeg',
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
                    if (infoDiv) infoDiv.textContent = `Progression : ${percent}%`
                })
            } catch (e) {
                console.error('❌ initScratchCard error:', e)
                alert('Erreur lors de l\'initialisation')
                setIsLoading(false)
            }
        }

        setTimeout(init, 100)
    }, [scratchReady])

    // Affichage final
    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
            {accessDenied ? (
                <div className="w-full max-w-xs text-center">
                    <h1 className="text-2xl font-bold mb-4">Accès refusé</h1>
                    <p className="text-gray-600">
                        Vous devez soumettre un ticket valide contenant un menu MXBO ou Best Of pour accéder au jeu.
                    </p>
                </div>
            ) : (
                <div className="sc__wrapper">
                    <div
                        ref={(ref) => {
                            containerRef.current = ref
                            if (ref) {
                                console.log('✅ containerRef ready')
                                setScratchReady(true)
                            }
                        }}
                        id="js--sc--container"
                        className="sc__container"
                    />
                    {isLoading && (
                        <div className="w-full max-w-xs text-center mt-4">
                            <div className="w-full bg-gray-300 rounded-full h-2.5 mb-2">
                                <div className="bg-blue-600 h-2.5 rounded-full animate-pulse w-3/4" />
                            </div>
                            <p className="text-sm text-gray-600">Chargement du jeu...</p>
                        </div>
                    )}
                    <div className="sc__infos mt-4 text-center">Progression : 0%</div>
                </div>
            )}
        </main>
    )
}
