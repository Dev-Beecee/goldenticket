import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30 // Augmentez si nécessaire pour OpenAI
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    const { imageUrl } = await req.json()

    if (!imageUrl || typeof imageUrl !== 'string') {
        return NextResponse.json({ error: 'imageUrl manquant ou invalide' }, { status: 400 })
    }

    try {
        // Vérification que l'URL est valide
        new URL(imageUrl)

        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                response_format: { type: "json_object" },
                messages: [
                    {
                        role: 'system',
                        content: 'Vous êtes un expert en analyse de tickets de caisse. Extrayez les informations avec précision.'
                    },
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: `Analysez ce ticket de caisse et retournez UNIQUEMENT un objet JSON avec:
- ocr_restaurant (string)
- ocr_date_achat (string au format JJ/MM/AAAA ou JJ/MM/AA, attention : "21/06/25" signifie 21 juin 2025, pas 2021)
- ocr_heure_achat (string au format HH:MM:SS, exemple "16:05:09")
- ocr_montant (string avec point comme séparateur décimal)
-contient_menu_mxbo (boolean, true si le ticket mentionne un menu MXBO, Best Of ou BO, false sinon)

Exemple: {
  "ocr_restaurant": "Carrefour",
  "ocr_date_achat": "15/05/2023",
  "ocr_heure_achat": "16:05:09",
  "ocr_montant": "42.50",
  "contient_menu_mxbo": true
}`
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: imageUrl,
                                    detail: 'high' // Meilleure qualité d'analyse
                                },
                            }
                        ]
                    }
                ],
                max_tokens: 300,
                temperature: 0.1 // Pour plus de précision
            }),
        })

        if (!openaiRes.ok) {
            const errorData = await openaiRes.json()
            console.error('Erreur OpenAI:', errorData)
            return NextResponse.json(
                { error: 'Erreur API OpenAI', details: errorData },
                { status: openaiRes.status }
            )
        }

        const data = await openaiRes.json()
        const content = data.choices?.[0]?.message?.content

        if (!content) {
            throw new Error('Réponse OpenAI invalide - contenu manquant')
        }

        try {
            const parsedContent = JSON.parse(content)
            // Corriger la date si l'année semble être au format à 2 chiffres (ex : 25 au lieu de 2025)
            if (parsedContent.ocr_date_achat) {
                const [jour, mois, annee] = parsedContent.ocr_date_achat.split('/')
                if (annee.length === 2) {
                    const yearInt = parseInt(annee, 10)
                    const correctedYear = yearInt < 50 ? `20${annee}` : `19${annee}`
                    parsedContent.ocr_date_achat = `${jour}/${mois}/${correctedYear}`
                }
            }
            return NextResponse.json(parsedContent)
        } catch (parseError) {
            console.error('Erreur de parsing:', parseError)
            return NextResponse.json(
                { error: 'Format de réponse invalide', content },
                { status: 500 }
            )
        }

    } catch (error) {
        console.error('Erreur globale:', error)
        let errorDetails = 'Erreur inconnue'
        let stack: string | undefined

        if (error instanceof Error) {
            errorDetails = error.message
            stack = process.env.NODE_ENV === 'development' ? error.stack : undefined
        } else if (typeof error === 'string') {
            errorDetails = error
        }

        return NextResponse.json(
            {
                error: 'Erreur de traitement',
                details: errorDetails,
                stack
            },
            { status: 500 }
        )
    }
}