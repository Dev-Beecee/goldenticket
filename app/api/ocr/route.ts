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
                                text: `Analysez ce ticket de caisse et retournez UNIQUEMENT un objet JSON avec les champs suivants :

- ocr_date_achat (format JJ/MM/AAAA)
- ocr_heure_achat (format HH:MM)
- ocr_montant (nombre en string, avec un point comme séparateur décimal)
- contient_menu_mxbo (boolean) : true si "MXBO" ou "Best Of" est mentionné dans le ticket, sinon false

Exemple :
{
  "ocr_date_achat": "15/05/2023",
  "ocr_heure_achat": "12:34",
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