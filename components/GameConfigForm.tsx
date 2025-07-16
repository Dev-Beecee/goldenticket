"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase-client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Types pour le point de gradient
interface GradientColorPoint {
  color: string;
  position: number; // 0-100
  opacity: number; // 0-1
}

const BUCKET = "reglage-site";

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input type="color" value={value} onChange={e => onChange(e.target.value)} style={{ width: 40, height: 40, border: "none", background: "none" }} />
  );
}

export default function GameConfigForm() {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [imagePartageFile, setImagePartageFile] = useState<File | null>(null);
  const [headerImageFile, setHeaderImageFile] = useState<File | null>(null);
  const [backgroundType, setBackgroundType] = useState<"solid" | "linear-gradient">("solid");
  const [backgroundDirection, setBackgroundDirection] = useState<string>("to right");
  const [backgroundColors, setBackgroundColors] = useState<GradientColorPoint[]>([{ color: "#ffffff", position: 0, opacity: 1 }]);
  const [reglementFile, setReglementFile] = useState<File | null>(null);
  const [consigneImageFile, setConsigneImageFile] = useState<File | null>(null);
  const { toast } = useToast();

  // Charger la config existante
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from("reglage_site").select("*").limit(1).single();
      if (data) {
        setConfig(data);
        setBackgroundType(data.background_type || "solid");
        // Migration auto : si background_colors est un tableau de string, on convertit
        if (data.background_type === "linear-gradient") {
          if (Array.isArray(data.background_colors) && typeof data.background_colors[0] === "object") {
            setBackgroundColors(data.background_colors);
          } else if (Array.isArray(data.background_colors)) {
            setBackgroundColors(data.background_colors.map((c: string, i: number) => ({ color: c, position: i * (100 / (data.background_colors.length - 1)), opacity: 1 })));
          } else {
            setBackgroundColors([{ color: "#ffffff", position: 0, opacity: 1 }]);
          }
          setBackgroundDirection(data.background_direction || "to right");
        } else {
          // solid
          if (Array.isArray(data.background_colors)) {
            setBackgroundColors([{ color: data.background_colors[0] || "#ffffff", position: 0, opacity: 1 }]);
          } else {
            setBackgroundColors([{ color: "#ffffff", position: 0, opacity: 1 }]);
          }
        }
      }
      setLoading(false);
    })();
  }, []);

  // Upload image et retourne l'URL publique
  async function uploadImage(file: File, field: "image_partage_url" | "header_image_url" | "consigne_image_url") {
    const ext = file.name.split(".").pop();
    const fileName = `${field}-${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage.from(BUCKET).upload(fileName, file, { upsert: true });
    if (error) throw error;
    const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
    return publicUrl.publicUrl;
  }

  async function uploadFile(file: File, field: string) {
    const ext = file.name.split(".").pop();
    const fileName = `${field}-${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage.from(BUCKET).upload(fileName, file, { upsert: true });
    if (error) throw error;
    const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
    return publicUrl.publicUrl;
  }

  async function handleSave() {
    setLoading(true);
    let image_partage_url = config?.image_partage_url || null;
    let header_image_url = config?.header_image_url || null;
    try {
      if (imagePartageFile) {
        image_partage_url = await uploadImage(imagePartageFile, "image_partage_url");
      }
      if (headerImageFile) {
        header_image_url = await uploadImage(headerImageFile, "header_image_url");
      }
      let reglement = config?.reglement || null;
      if (reglementFile) {
        reglement = await uploadFile(reglementFile, "reglement");
      }
      let consigne_image_url = config?.consigne_image_url || null;
      if (consigneImageFile) {
        consigne_image_url = await uploadImage(consigneImageFile, "consigne_image_url");
      }
      // Préparation du background
      let background_colors: any = backgroundColors;
      let background_direction: string | undefined = undefined;
      if (backgroundType === "linear-gradient") {
        background_colors = backgroundColors;
        background_direction = backgroundDirection;
      } else {
        background_colors = [backgroundColors[0]?.color || "#ffffff"];
        background_direction = undefined;
      }
      const payload = {
        ...config,
        image_partage_url,
        header_image_url,
        background_type: backgroundType,
        background_colors,
        background_direction,
        reglement,
        consigne_image_url,
        texte_color: config?.texte_color || null,
        button_background_color: config?.button_background_color || null,
        button_text_color: config?.button_text_color || null,
        button_border_radius: config?.button_border_radius || null,
        card_background_color: config?.card_background_color || null,
        card_border_radius: config?.card_border_radius || null,
        card_border: config?.card_border || null,
      };
      let res;
      if (config?.id) {
        res = await supabase.from("reglage_site").update(payload).eq("id", config.id);
      } else {
        res = await supabase.from("reglage_site").insert(payload);
      }
      if (res.error) throw res.error;
      toast({
        title: "Succès",
        description: "Configuration enregistrée !",
        variant: "default"
      });
    } catch (e: any) {
      toast({
        title: "Erreur",
        description: e.message,
        variant: "destructive"
      });
    }
    setLoading(false);
  }

  // Génération du CSS du gradient
  function getGradientCSS() {
    if (backgroundType !== "linear-gradient") return backgroundColors[0]?.color || "#ffffff";
    const stops = backgroundColors.map(pt => {
      const col = pt.opacity < 1 ? hexToRgba(pt.color, pt.opacity) : pt.color;
      return `${col} ${pt.position}%`;
    }).join(", ");
    return `linear-gradient(${backgroundDirection}, ${stops})`;
  }

  // Utilitaire pour convertir hex + opacité en rgba
  function hexToRgba(hex: string, opacity: number) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r},${g},${b},${opacity})`;
  }

  if (loading && !config) return <div>Chargement…</div>;

  return (
    <form className="space-y-6 max-w-xl" onSubmit={e => { e.preventDefault(); handleSave(); }}>
      <h2 className="text-xl font-bold mb-2 text-black">Configuration du jeu</h2>
      <div>
        <label className="text-black">Image de partage :</label>
        <Input type="file" accept="image/*" onChange={e => setImagePartageFile(e.target.files?.[0] || null)} />
        {config?.image_partage_url && <img src={config.image_partage_url} alt="aperçu partage" className="mt-2 max-h-32" />}
      </div>
      <div>
        <label className="text-black">Méta-titre :</label>
        <Input value={config?.meta_title || ""} onChange={e => setConfig((c: any) => ({ ...c, meta_title: e.target.value }))} />
      </div>
      <div>
        <label className="text-black">Méta-description :</label>
        <Input value={config?.meta_description || ""} onChange={e => setConfig((c: any) => ({ ...c, meta_description: e.target.value }))} />
      </div>
      <div>
        <label className="text-black">Type de background :</label>
        <select value={backgroundType} onChange={e => setBackgroundType(e.target.value as any)} className="border rounded p-2 ml-2">
          <option value="solid">Couleur unie</option>
          <option value="linear-gradient">Dégradé linéaire</option>
        </select>
      </div>
      {backgroundType === "linear-gradient" && (
        <div className="border p-3 rounded mt-2 bg-gray-50">
          <div className="mb-2">
            <label className="text-black">Direction du gradient :</label>
            <select value={backgroundDirection} onChange={e => setBackgroundDirection(e.target.value)} className="border rounded p-2 ml-2">
              <option value="to right">→ Horizontal (to right)</option>
              <option value="to left">← Horizontal (to left)</option>
              <option value="to bottom">↓ Vertical (to bottom)</option>
              <option value="to top">↑ Vertical (to top)</option>
              <option value="135deg">135° (diagonale)</option>
              <option value="45deg">45° (diagonale)</option>
              <option value="custom">Autre (saisir manuellement)</option>
            </select>
            {backgroundDirection === "custom" && (
              <input type="text" className="border ml-2 p-1 rounded" placeholder="Ex: 60deg, to bottom right..." onChange={e => setBackgroundDirection(e.target.value)} />
            )}
          </div>
          <div>
            <label className="text-black">Points de couleur :</label>
            <div className="flex flex-col gap-2 mt-2">
              {backgroundColors.map((pt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <ColorPicker value={pt.color} onChange={v => setBackgroundColors(colors => colors.map((c, i) => i === idx ? { ...c, color: v } : c))} />
                  <input type="number" min={0} max={100} value={pt.position} onChange={e => setBackgroundColors(colors => colors.map((c, i) => i === idx ? { ...c, position: Number(e.target.value) } : c))} className="w-16 border rounded p-1" />
                  <span className="text-black">%</span>
                  <input type="number" min={0} max={1} step={0.01} value={pt.opacity} onChange={e => setBackgroundColors(colors => colors.map((c, i) => i === idx ? { ...c, opacity: Number(e.target.value) } : c))} className="w-16 border rounded p-1" />
                  <span className="text-black">opacité</span>
                  {backgroundColors.length > 2 && (
                    <Button type="button" size="sm" variant="destructive" onClick={() => setBackgroundColors(colors => colors.filter((_, i) => i !== idx))}>-</Button>
                  )}
                </div>
              ))}
              <Button type="button" size="sm" onClick={() => setBackgroundColors(colors => [...colors, { color: "#000000", position: 100, opacity: 1 }])}>Ajouter une couleur</Button>
            </div>
          </div>
          <div className="mt-4">
            <label className="text-black">Aperçu du gradient :</label>
            <div className="h-16 w-full rounded" style={{ background: getGradientCSS(), border: "1px solid #ccc" }} />
          </div>
        </div>
      )}
      {backgroundType === "solid" && (
        <div className="flex items-center gap-2 mt-2">
          <label className="text-black">Couleur de fond :</label>
          <ColorPicker value={backgroundColors[0]?.color || "#ffffff"} onChange={v => setBackgroundColors([{ ...backgroundColors[0], color: v }])} />
        </div>
      )}
      <div>
        <label className="text-black">Règlement du jeu (PDF ou texte) :</label>
        <Input type="file" accept=".pdf,.txt,.doc,.docx" onChange={e => setReglementFile(e.target.files?.[0] || null)} />
        {config?.reglement && (
          <a href={config.reglement} target="_blank" rel="noopener noreferrer" className="block mt-2 text-blue-600 underline">Télécharger le règlement actuel</a>
        )}
      </div>
      <div>
        <label className="text-black">Image du header :</label>
        <Input type="file" accept="image/*" onChange={e => setHeaderImageFile(e.target.files?.[0] || null)} />
        {config?.header_image_url && <img src={config.header_image_url} alt="aperçu header" className="mt-2 max-h-32" />}
      </div>
      <div>
        <label className="text-black">Image de la consigne :</label>
        <Input type="file" accept="image/*" onChange={e => setConsigneImageFile(e.target.files?.[0] || null)} />
        {config?.consigne_image_url && <img src={config.consigne_image_url} alt="aperçu consigne" className="mt-2 max-h-32" />}
      </div>
      <div>
        <label className="text-black">Couleur du texte du site :</label>
        <ColorPicker value={config?.texte_color || "#000000"} onChange={v => setConfig((c: any) => ({ ...c, texte_color: v }))} />
      </div>
      <div>
        <label className="text-black">Couleur de fond du bouton :</label>
        <ColorPicker value={config?.button_background_color || "#000000"} onChange={v => setConfig((c: any) => ({ ...c, button_background_color: v }))} />
      </div>
      <div>
        <label className="text-black">Couleur du texte du bouton :</label>
        <ColorPicker value={config?.button_text_color || "#ffffff"} onChange={v => setConfig((c: any) => ({ ...c, button_text_color: v }))} />
      </div>
      <div>
        <label className="text-black">Arrondi du bouton (px) :</label>
        <Input type="number" value={config?.button_border_radius ?? ''} onChange={e => setConfig((c: any) => ({ ...c, button_border_radius: e.target.value }))} />
      </div>
      <div>
        <label className="text-black">Couleur de fond de la carte :</label>
        <ColorPicker value={config?.card_background_color || "#ffffff"} onChange={v => setConfig((c: any) => ({ ...c, card_background_color: v }))} />
      </div>
      <div>
        <label className="text-black">Arrondi de la carte (px) :</label>
        <Input type="number" value={config?.card_border_radius ?? ''} onChange={e => setConfig((c: any) => ({ ...c, card_border_radius: e.target.value }))} />
      </div>
      <div>
        <label className="text-black">Style de bordure de la carte (ex: 1px solid #000) :</label>
        <Input value={config?.card_border || ''} onChange={e => setConfig((c: any) => ({ ...c, card_border: e.target.value }))} />
      </div>
      <Button type="submit" disabled={loading}>{loading ? "Enregistrement…" : "Enregistrer la configuration"}</Button>
    </form>
  );
} 