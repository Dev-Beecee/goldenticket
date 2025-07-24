import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
    const res = NextResponse.next()
    
    // Créer le client Supabase pour le middleware
    const supabase = createMiddlewareClient({ req, res })

    // Actualiser la session si elle est expirée - nécessaire pour les routes côté serveur
    try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        // Si une session existe, on tente de la rafraîchir si nécessaire
        if (session) {
            const { data: { user }, error: userError } = await supabase.auth.getUser()
            if (userError && userError.message === 'JWT expired') {
                // Le token est expiré, on laisse Supabase gérer le rafraîchissement automatiquement
                console.log('[MIDDLEWARE] Token expiré, rafraîchissement automatique en cours')
            }
        }
        
        // Pages protégées
        const protectedPaths = ['/ghost-dashboard']
        const isProtectedPath = protectedPaths.some(path => 
            req.nextUrl.pathname.startsWith(path)
        )
        
        if (isProtectedPath && !session) {
            return NextResponse.redirect(new URL('/ghost', req.url))
        }
        
    } catch (error) {
        console.error('[MIDDLEWARE] Erreur lors de la vérification de session:', error)
        // En cas d'erreur, on laisse la requête continuer
    }
    
    return res
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
} 