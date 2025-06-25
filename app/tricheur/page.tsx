import React from 'react'

export default function TricheurPage() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-6">
            <div className="w-full max-w-xs text-center">
                <h1 className="text-2xl font-bold mb-4 text-red-700">Petit tricheur !</h1>
                <p className="text-gray-700 mb-4">
                    Tu as déjà joué avec ce ticket.<br />
                    Reviens demain avec un nouveau ticket pour retenter ta chance !
                </p>
                <img src="/perdu.jpeg" alt="Déjà joué" className="mx-auto rounded shadow-md w-48 h-48 object-cover" />
            </div>
        </main>
    )
} 