import React, { useState } from 'react';

const CreateRepartitionForm = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleClick = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('https://vnmijcjshzwwpbzjqgwx.supabase.co/functions/v1/create-repartition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Ajoute ici le body si besoin (ex: les quantités par lot)
        body: JSON.stringify({})
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setMessage('Répartition créée avec succès !');
      } else {
        setMessage(data.error || 'Erreur lors de la création de la répartition.');
      }
    } catch (err) {
      setMessage('Erreur réseau ou serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          backgroundColor: 'black',
          color: 'white',
          padding: '0.75rem 1.5rem',
          borderRadius: '0.5rem',
          border: 'none',
          fontWeight: 'bold',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Traitement...' : 'Créer la répartition'}
      </button>
      {message && (
        <p style={{ marginTop: '1rem', color: message.includes('succès') ? 'green' : 'red' }}>{message}</p>
      )}
    </div>
  );
};

export default CreateRepartitionForm;
