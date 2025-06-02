'use client'

export function Footer() {
    return (
        <footer className="w-full border-t mt-12 py-6 text-center text-sm text-muted-foreground">
            <a
                href="/documents/reglement.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
            >
                Réglement
            </a>
        </footer>
    )
}