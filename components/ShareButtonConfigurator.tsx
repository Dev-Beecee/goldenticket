import React, { useState, useEffect } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'
import { Button } from "@/components/ui/button";

interface ShareButtonConfiguratorProps {
  userId: string; // L'identifiant de l'utilisateur inscrit
  baseShareUrl: string; // L'URL de base à partager (ex: https://monjeu.com)
}

const BUCKET = "reglage-site";

const ShareButtonConfigurator: React.FC<ShareButtonConfiguratorProps> = ({ userId, baseShareUrl }) => {
  const [image, setImage] = useState<string>("");
  const [metaDescription, setMetaDescription] = useState<string>("");
  const [customMessage, setCustomMessage] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Génération du lien traqué
  const trackedUrl = `${baseShareUrl}?ref=${encodeURIComponent(userId)}`;

  // Gestion de l'upload d'image dans Supabase Storage
  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    const supabase = createClientComponentClient<Database>();
    const ext = file.name.split('.').pop();
    const fileName = `partage-image-${Date.now()}.${ext}`;
    // Upload
    const { data, error } = await supabase.storage.from(BUCKET).upload(fileName, file, { upsert: true });
    if (error) {
      alert("Erreur lors de l'upload de l'image");
      setIsUploading(false);
      return;
    }
    // Get public URL
    const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
    setImage(publicUrl.publicUrl);
    setIsUploading(false);
  };

  // Suppression de l'image du bucket si c'est une image uploadée
  const handleDeleteImage = async () => {
    if (!image) return;
    // On ne supprime du bucket que si l'image vient du bucket
    if (image.includes(`/storage/v1/object/public/${BUCKET}/`)) {
      const supabase = createClientComponentClient<Database>();
      const path = image.split(`/storage/v1/object/public/${BUCKET}/`)[1];
      if (path) {
        await supabase.storage.from(BUCKET).remove([path]);
      }
    }
    setImage("");
    setImageFile(null);
  };

  // Gestion du partage (Web Share API ou fallback)
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: metaDescription,
          text: customMessage,
          url: trackedUrl,
        });
      } catch (error) {
        alert("Le partage a échoué ou a été annulé.");
      }
    } else {
      // Fallback : copie le lien dans le presse-papier
      await navigator.clipboard.writeText(trackedUrl);
      alert("Lien copié dans le presse-papier !");
    }
  };

  const handleSaveConfig = async () => {
    const supabase = createClientComponentClient<Database>()

    const { error } = await supabase
      .from('partage_config')
      .upsert([
        {
          id: '00000000-0000-0000-0000-000000000001', // id fixe pour la config globale
          image_url: image,
          meta_description: metaDescription,
          message_defaut: customMessage,
          updated_at: new Date().toISOString(),
        },
      ], { onConflict: 'id' })

    if (error) {
      alert("Erreur lors de l'enregistrement !");
    } else {
      alert("Configuration enregistrée !");
    }
  }

  useEffect(() => {
    const fetchConfig = async () => {
      const supabase = createClientComponentClient<Database>();
      const { data, error } = await supabase
        .from('partage_config')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .single();

      if (data) {
        setImage(data.image_url || "");
        setMetaDescription(data.meta_description || "");
        setCustomMessage(data.message_defaut || "");
      }
    };
    fetchConfig();
  }, []);

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 24, maxWidth: 400 }}>
      <h2 className="text-black">Paramétrer le bouton de partage</h2>
      <form onSubmit={e => e.preventDefault()}>
        <div style={{ marginBottom: 12 }}>
          <label className="text-black">Image de partage (URL) :</label>
          <input
            type="text"
            value={image}
            onChange={e => setImage(e.target.value)}
            placeholder="https://..."
            style={{ width: "100%" }}
            disabled={isUploading}
          />
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <input
              type="file"
              accept="image/*"
              onChange={e => {
                if (e.target.files?.[0]) {
                  setImageFile(e.target.files[0]);
                  handleImageUpload(e.target.files[0]);
                }
              }}
              disabled={isUploading}
            />
            {image && (
              <Button type="button" variant="destructive" size="sm" onClick={handleDeleteImage} style={{ marginLeft: 8 }}>
                Supprimer l'image
              </Button>
            )}
          </div>
          {isUploading && <div style={{ color: '#888', marginTop: 4 }}>Upload en cours…</div>}
        </div>
        <div style={{ marginBottom: 12 }}>
          <label className="text-black">Méta description :</label>
          <input
            type="text"
            value={metaDescription}
            onChange={e => setMetaDescription(e.target.value)}
            placeholder="Décrivez le partage..."
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label className="text-black">Message personnalisé (optionnel) :</label>
          <input
            type="text"
            value={customMessage}
            onChange={e => setCustomMessage(e.target.value)}
            placeholder="Viens jouer avec moi !"
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label className="text-black">Lien de partage traqué :</label>
          <input type="text" value={trackedUrl} readOnly style={{ width: "100%" }} />
        </div>
        <Button type="button" onClick={handleShare} style={{ marginTop: 16 }}>
          Partager
        </Button>
        <Button type="button" onClick={handleSaveConfig} style={{ marginTop: 16, marginLeft: 8 }}>
          Enregistrer la configuration
        </Button>
      </form>
      {image && (
        <div style={{ marginTop: 16 }}>
          <strong className="text-black">Aperçu de l'image :</strong>
          <div>
            <img src={image} alt="Aperçu" style={{ maxWidth: "100%", maxHeight: 120 }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareButtonConfigurator; 