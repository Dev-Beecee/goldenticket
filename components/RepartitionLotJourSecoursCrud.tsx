"use client";
import { useEffect, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase-client";
import { useToast } from "@/hooks/use-toast";

interface Lot {
  id: string;
  titre: string;
}

interface RepartitionLotJourSecours {
  id: string;
  lot_id: string;
  date_jour: string;
  heure_distribution: string | null;
  quantite_disponible: number;
  quantite_distribuee: number;
  lot?: Lot;
}

export default function RepartitionLotJourSecoursCrud() {
  const [repartitions, setRepartitions] = useState<RepartitionLotJourSecours[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    lot_id: "",
    date_jour: "",
    heure_distribution: "",
    quantite_disponible: 0,
    quantite_distribuee: 0
  });
  const [editId, setEditId] = useState<string | null>(null);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  // Charger la liste des lots
  const fetchLots = async () => {
    const { data, error } = await supabase.from("lot").select("id, titre").order("titre");
    if (error) {
      toast({ title: "Erreur", description: "Impossible de charger les lots: " + error.message, variant: "destructive" });
    } else {
      setLots(data || []);
    }
  };

  // Charger la liste des répartitions
  const fetchRepartitions = async () => {
    setLoading(true);
    
    // Récupérer d'abord toutes les répartitions
    const { data: repartitionsData, error: repartitionsError } = await supabase
      .from("repartition_lot_jour_secours")
      .select("*")
      .order("date_jour", { ascending: false });
    
    if (repartitionsError) {
      toast({ title: "Erreur", description: "Impossible de charger les répartitions: " + repartitionsError.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Récupérer tous les lots
    const { data: lotsData, error: lotsError } = await supabase
      .from("lot")
      .select("id, titre");
    
    if (lotsError) {
      toast({ title: "Erreur", description: "Impossible de charger les lots: " + lotsError.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Créer un map des lots pour une recherche rapide
    const lotsMap = new Map(lotsData?.map(lot => [lot.id, lot]) || []);
    
    // Combiner les données
    const repartitionsWithLots = (repartitionsData || []).map(repartition => ({
      ...repartition,
      lot: lotsMap.get(repartition.lot_id)
    }));
    
    setRepartitions(repartitionsWithLots);
    setLoading(false);
  };

  useEffect(() => {
    fetchLots();
    fetchRepartitions();
    // eslint-disable-next-line
  }, []);

  // Gérer le formulaire (ajout ou édition)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.lot_id || !form.date_jour) {
      toast({ title: "Champs requis", description: "Le lot et la date sont obligatoires.", variant: "destructive" });
      return;
    }
    
    if (form.quantite_disponible < 0 || form.quantite_distribuee < 0) {
      toast({ title: "Valeurs invalides", description: "Les quantités doivent être positives.", variant: "destructive" });
      return;
    }

    setLoading(true);
    if (editId) {
      // Update
      const { error } = await supabase
        .from("repartition_lot_jour_secours")
        .update({
          ...form,
          heure_distribution: form.heure_distribution || null
        })
        .eq("id", editId);
      
      if (error) {
        toast({ title: "Erreur modification", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Succès", description: "Répartition modifiée." });
        setEditId(null);
        setForm({ lot_id: "", date_jour: "", heure_distribution: "", quantite_disponible: 0, quantite_distribuee: 0 });
        fetchRepartitions();
      }
    } else {
      // Insert
      const { error } = await supabase
        .from("repartition_lot_jour_secours")
        .insert([{
          ...form,
          heure_distribution: form.heure_distribution || null
        }]);
      
      if (error) {
        toast({ title: "Erreur ajout", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Succès", description: "Répartition ajoutée." });
        setForm({ lot_id: "", date_jour: "", heure_distribution: "", quantite_disponible: 0, quantite_distribuee: 0 });
        fetchRepartitions();
      }
    }
    setLoading(false);
  };

  // Pré-remplir pour édition
  const handleEdit = (r: RepartitionLotJourSecours) => {
    setEditId(r.id);
    setForm({
      lot_id: r.lot_id,
      date_jour: r.date_jour,
      heure_distribution: r.heure_distribution || "",
      quantite_disponible: r.quantite_disponible,
      quantite_distribuee: r.quantite_distribuee
    });
    
    // Scroll automatique vers le formulaire
    setTimeout(() => {
      formRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  };

  // Suppression
  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer cette répartition ?")) return;
    setLoading(true);
    const { error } = await supabase
      .from("repartition_lot_jour_secours")
      .delete()
      .eq("id", id);
    
    if (error) {
      toast({ title: "Erreur suppression", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Supprimé", description: "Répartition supprimée." });
      fetchRepartitions();
    }
    setLoading(false);
  };

  // Formater la date pour l'affichage
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  // Formater l'heure pour l'affichage
  const formatTime = (timeString: string | null) => {
    if (!timeString) return '';
    return timeString.substring(0, 5); // Affiche HH:MM
  };

  return (
    <div className="">
      <h2 className="text-2xl font-bold mb-4 text-black">Gestion des répartitions </h2>
      
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div>
          <Label htmlFor="lot_id" className="text-black">Lot</Label>
          <Select 
            value={form.lot_id} 
            onValueChange={(value) => setForm(f => ({ ...f, lot_id: value }))}
            disabled={loading}
          >
            <SelectTrigger className="text-black">
              <SelectValue placeholder="Sélectionner un lot" />
            </SelectTrigger>
            <SelectContent>
              {lots.map((lot) => (
                <SelectItem key={lot.id} value={lot.id}>
                  {lot.titre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="date_jour" className="text-black">Date du jour</Label>
          <Input 
            id="date_jour" 
            type="date" 
            value={form.date_jour} 
            onChange={e => setForm(f => ({ ...f, date_jour: e.target.value }))} 
            required 
            disabled={loading} 
            className="text-black" 
          />
        </div>

        <div>
          <Label htmlFor="heure_distribution" className="text-black">Heure de distribution</Label>
          <Input 
            id="heure_distribution" 
            type="time" 
            value={form.heure_distribution || ''} 
            onChange={e => setForm(f => ({ ...f, heure_distribution: e.target.value }))} 
          
            disabled={loading} 
            className="text-black" 
          />
        </div>

        <div>
          <Label htmlFor="quantite_disponible" className="text-black">Quantité disponible</Label>
          <Input 
            id="quantite_disponible" 
            type="number" 
            min="0"
            value={form.quantite_disponible} 
            onChange={e => setForm(f => ({ ...f, quantite_disponible: parseInt(e.target.value) || 0 }))} 
            required 
            disabled={loading} 
            className="text-black" 
          />
        </div>

        <div>
          <Label htmlFor="quantite_distribuee" className="text-black">Quantité distribuée</Label>
          <Input 
            id="quantite_distribuee" 
            type="number" 
            min="0"
            value={form.quantite_distribuee} 
            onChange={e => setForm(f => ({ ...f, quantite_distribuee: parseInt(e.target.value) || 0 }))} 
            required 
            disabled={loading} 
            className="text-black" 
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {editId ? "Modifier" : "Ajouter"}
          </Button>
          {editId && (
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => { 
                setEditId(null); 
                setForm({ lot_id: "", date_jour: "", heure_distribution: "", quantite_disponible: 0, quantite_distribuee: 0 }); 
              }} 
              disabled={loading}
            >
              Annuler
            </Button>
          )}
        </div>
      </form>

      <h3 className="text-xl font-semibold mb-2">Liste des répartitions</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-md">
          <thead>
            <tr>
              <th className="px-4 py-2 border-b text-black">Date</th>
              <th className="px-4 py-2 border-b text-black">Lots</th>
              <th className="px-4 py-2 border-b text-black">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              // Grouper les répartitions par date
              const groupedByDate = repartitions.reduce((acc, repartition) => {
                const date = repartition.date_jour;
                if (!acc[date]) {
                  acc[date] = [];
                }
                acc[date].push(repartition);
                return acc;
              }, {} as Record<string, RepartitionLotJourSecours[]>);

              // Trier les dates (plus proche en premier)
              const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

              return sortedDates.map(date => {
                const repartitionsForDate = groupedByDate[date];
                const isFirstRow = true;

                return repartitionsForDate.map((repartition, index) => (
                  <tr key={repartition.id}>
                    {index === 0 && (
                      <td 
                        className="px-4 py-2 border-b text-black font-semibold" 
                        rowSpan={repartitionsForDate.length}
                      >
                        {formatDate(date)}
                      </td>
                    )}
                    <td className="px-4 py-2 border-b text-black">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{repartition.lot?.titre || 'Lot inconnu'}</span>
                        <span className="text-sm text-gray-600">
                          {repartition.quantite_disponible} dispo, {repartition.quantite_distribuee} distribués
                          {repartition.heure_distribution && (
                            <span className="ml-2 text-gray-500">
                              ({formatTime(repartition.heure_distribution)})
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 border-b space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(repartition)} 
                        disabled={loading}
                        className="text-black"
                      >
                        Éditer
                      </Button>
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDelete(repartition.id)} 
                        disabled={loading}
                        className="text-black"
                      >
                        Supprimer
                      </Button>
                    </td>
                  </tr>
                ));
              }).flat();
            })()}
            {repartitions.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-4 text-black">Aucune répartition</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 