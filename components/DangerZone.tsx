"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";

const TABLES = [
  "inscription",
  "participation",
  "periode_jeu",
  "lot",
  "periode_jeu_lot",
  "repartition_lot_jour",
  "lot_attribue",
  "type_lot",
  "restaurant",
  "partage",
  "partage_config"
];

export default function DangerZone() {
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setResult(null);
    try {
      for (const table of TABLES) {
        const { error } = await supabase.from(table).delete().neq('id', ''); // supprime tout
        if (error) throw error;
      }
      setResult("Toutes les tables (hors reglage_site) ont été vidées !");
    } catch (e: any) {
      setResult("Erreur : " + e.message);
    }
    setLoading(false);
  }

  return (
    <div className="border border-red-500 rounded p-6 mt-8 bg-red-50">
      <h2 className="text-lg font-bold text-red-700 mb-2">Zone dangereuse</h2>
      <p className="mb-4 text-red-700">Cette action va supprimer <b>toutes les données</b> du projet (sauf la configuration du jeu). Opération irréversible !</p>
      <div className="mb-2">
        <label className="block mb-1">Tapez <b>SUPPRIMER</b> pour confirmer :</label>
        <input
          type="text"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          className="border border-red-400 rounded px-2 py-1"
        />
      </div>
      <Button
        variant="destructive"
        disabled={confirm !== "SUPPRIMER" || loading}
        onClick={handleDelete}
      >
        Vider toutes les tables (hors reglage_site)
      </Button>
      {result && <div className="mt-4 text-red-700 font-semibold">{result}</div>}
    </div>
  );
} 