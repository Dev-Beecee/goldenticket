'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function RoleUpdater() {
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    const updateRole = async () => {
        setLoading(true)
        const supabase = createClientComponentClient()

        const { data, error } = await supabase.auth.updateUser({
            data: {
                role: 'admin' // Change selon ton besoin
            }
        })

        if (error) {
            console.error('Erreur mise à jour rôle :', error)
            setMessage('Erreur lors de la mise à jour')
        } else {
            console.log('Rôle mis à jour :', data)
            setMessage('Rôle mis à jour avec succès')
        }

        setLoading(false)
    }

    return (
        <div>
            <button onClick={updateRole} disabled={loading}>
                {loading ? 'Mise à jour...' : 'Ajouter rôle admin'}
            </button>
            {message && <p>{message}</p>}
        </div>
    )
}
