'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import './GamePage.css'

export default function GamePage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const containerRef = useRef<HTMLDivElement | null>(null)

    const [inscriptionId, setInscriptionId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [accessDenied, setAccessDenied] = useState(false)
    const [scratchReady, setScratchReady] = useState(false)
    const [imageResult, setImageResult] = useState('/perdu.jpeg')
    const [lotInstructions, setLotInstructions] = useState('')
    const [lotLoaded, setLotLoaded] = useState(false)


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
        const participationId = searchParams.get('id')
        if (!participationId) return

        fetch('https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/bright-function', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participation_id: participationId }),
        })
            .then(res => res.json())
            .then(res => {
                if (res.access === true) {
                    // OK
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

    // Lancer la fonction de tirage dès que containerRef est prêt
    useEffect(() => {
        const participationId = searchParams.get('id')
        if (!scratchReady || !participationId) return

        const run = async () => {
            try {
                const res = await fetch('https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/attribuer-lot-force-gain', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ participation_id: participationId }),
                });

                const result = await res.json();

                // Gestion des cas spéciaux
                if (result.result === 'Déjà joué' && result.gain === true) {
                    router.push('/deja-gagne')
                    return;
                } else if (result.result === 'Déjà joué' && result.gain === false) {
                    router.push('/tricheur')
                    return;
                }

                if (result.gain) {
                    setImageResult(result.lot.image || '/images/gagne.jpeg');
                    setLotInstructions(result.lot.instructions || '');
                } else {
                    setImageResult(result.image || '/images/perdu.jpeg');
                }

                setLotLoaded(true);
            } catch (e) {
                console.error("❌ Erreur lors de l'appel attribuer-lot:", e);
                setImageResult('/images/perdu.jpeg');
                setLotLoaded(true);
            }
        }

        run()
    }, [scratchReady, searchParams])

    // Initialisation ScratchCard avec image dynamique une fois le lot prêt
    useEffect(() => {
        if (!scratchReady || !lotLoaded) return

        const init = async () => {
            try {
                const container = containerRef.current
                if (!container) throw new Error('Conteneur null')

                const { ScratchCard, SCRATCH_TYPE } = await import('scratchcard-js')

                const sc = new ScratchCard('#js--sc--container', {
                    scratchType: SCRATCH_TYPE.CIRCLE,
                    containerWidth: container.offsetWidth,
                    containerHeight: 300,
                    imageForwardSrc: '/header.png',
                    imageBackgroundSrc: imageResult,
                    htmlBackground: '',
                    brushSrc: imageResult,
                    clearZoneRadius: 50,
                    nPoints: 30,
                    pointSize: 4,
                    enabledPercentUpdate: true,
                    percentToFinish: 50,
                    callback: () => {
                        if (lotInstructions !== null && inscriptionId) {
                            router.push('/gagner')
                        } else {
                            router.push('/perdu')
                        }
                    }
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
                alert('Erreur lors de l\'initialisation du jeu.')
                setIsLoading(false)
            }
        }

        setTimeout(init, 100)
    }, [scratchReady, lotLoaded, imageResult])

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
                    <div className="sc__infos mt-4 text-center" style={{ display: 'none' }}>Progression : 0%</div>
                </div>
            )}
        </main>
    )
}
