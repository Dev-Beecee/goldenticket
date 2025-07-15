'use client'

import React, { useEffect, useState } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/database';

interface ShareButtonProps {
  inscriptionId: string; // id de l'utilisateur
  canal: string; // ex: 'whatsapp', 'facebook', 'email', etc.
  shareUrl: string; // lien à partager
  meta?: any; // infos optionnelles (description, image, etc.)
  children?: React.ReactNode; // pour customiser le bouton
}

const CONFIG_ID = '00000000-0000-0000-0000-000000000001';

const ShareButton: React.FC<ShareButtonProps> = ({ inscriptionId, canal, shareUrl, meta, children }) => {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      const supabase = createClientComponentClient<Database>();
      const { data, error } = await supabase
        .from('partage_config')
        .select('*')
        .eq('id', CONFIG_ID)
        .single();
      if (data) setConfig(data);
      setLoading(false);
    };
    fetchConfig();
  }, []);

  const handleShare = async () => {
    const supabase = createClientComponentClient<Database>();
    await supabase.from('partage').insert([
      {
        inscription_id: inscriptionId,
        canal,
        meta: meta ? meta : config ? {
          description: config.meta_description,
          image: config.image_url,
          message: config.message_defaut,
        } : null,
      },
    ]);

    // 2. Partage (Web Share API ou fallback)
    if (navigator.share) {
      try {
        await navigator.share({
          title: config?.meta_description,
          text: config?.message_defaut,
          url: shareUrl,
        });
      } catch (error) {
        alert("Le partage a échoué ou a été annulé.");
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      alert("Lien copié dans le presse-papier !");
    }
  };

  if (loading) return <button disabled>Chargement...</button>;

  return (
    <button type="button" onClick={handleShare} style={{ padding: 8, borderRadius: 6, background: '#FFB700', color: '#222', fontWeight: 600 }}>
      {children || 'Partager'}
    </button>
  );
};

export default ShareButton; 