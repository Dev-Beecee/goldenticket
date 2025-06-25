import React from 'react'

export default function DejaGagnePage() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-green-50 p-6">
            <div className="w-full max-w-xs text-center">
                <h1 className="text-2xl font-bold mb-4 text-green-700">Bravo !</h1>
                <p className="text-gray-700 mb-4">
                    Vous avez déjà gagné avec ce ticket.<br />
                    Consultez vos instructions dans votre email !
                </p>
                <img src="/images/gagne.jpeg" alt="Déjà gagné" className="mx-auto rounded shadow-md w-48 h-48 object-cover" />
            </div>
        </main>
    )
} 