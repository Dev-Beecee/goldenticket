import React from 'react'

export default function PerduPage() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
            <div className="w-full max-w-xs text-center">
                <h1 className="text-2xl font-bold mb-4">Dommage !</h1>
                <p className="text-gray-600 mb-4">
                    Vous n'avez pas gagné cette fois-ci.<br />
                    Retentez votre chance demain !
                </p>
                <img src="/perdu.jpeg" alt="Perdu" className="mx-auto rounded shadow-md w-48 h-48 object-cover" />
            </div>
        </main>
    )
} 