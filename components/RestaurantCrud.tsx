"use client";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase-client";
import { useToast } from "@/hooks/use-toast";

interface Restaurant {
  id: string;
  nom: string;
  code: string;
  acronym: string;
}

export default function RestaurantCrud() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nom: "", code: "", acronym: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const { toast } = useToast();

  // Charger la liste
  const fetchRestaurants = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("restaurant").select("*");
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setRestaurants(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRestaurants();
    // eslint-disable-next-line
  }, []);

  // Gérer le formulaire (ajout ou édition)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom || !form.code || !form.acronym) {
      toast({ title: "Champs requis", description: "Tous les champs sont obligatoires.", variant: "destructive" });
      return;
    }
    setLoading(true);
    if (editId) {
      // Update
      const { error } = await supabase.from("restaurant").update(form).eq("id", editId);
      if (error) {
        toast({ title: "Erreur modification", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Succès", description: "Restaurant modifié." });
        setEditId(null);
        setForm({ nom: "", code: "", acronym: "" });
        fetchRestaurants();
      }
    } else {
      // Insert
      const { error } = await supabase.from("restaurant").insert([form]);
      if (error) {
        toast({ title: "Erreur ajout", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Succès", description: "Restaurant ajouté." });
        setForm({ nom: "", code: "", acronym: "" });
        fetchRestaurants();
      }
    }
    setLoading(false);
  };

  // Pré-remplir pour édition
  const handleEdit = (r: Restaurant) => {
    setEditId(r.id);
    setForm({ nom: r.nom, code: r.code, acronym: r.acronym });
  };

  // Suppression
  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer ce restaurant ?")) return;
    setLoading(true);
    const { error } = await supabase.from("restaurant").delete().eq("id", id);
    if (error) {
      toast({ title: "Erreur suppression", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Supprimé", description: "Restaurant supprimé." });
      fetchRestaurants();
    }
    setLoading(false);
  };

  return (
    <div className="">
      <h2 className="text-2xl font-bold mb-4">Gestion des restaurants</h2>
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div>
          <Label htmlFor="nom" className="text-black">Nom</Label>
          <Input id="nom" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} required disabled={loading} className="text-black" />
        </div>
        <div>
          <Label htmlFor="code" className="text-black">Code</Label>
          <Input id="code" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} required disabled={loading} className="text-black" />
        </div>
        <div>
          <Label htmlFor="acronym" className="text-black">Acronyme</Label>
          <Input id="acronym" value={form.acronym} onChange={e => setForm(f => ({ ...f, acronym: e.target.value }))} required disabled={loading} className="text-black" />
        </div>
        <Button type="submit" disabled={loading}>
          {editId ? "Modifier" : "Ajouter"}
        </Button>
        {editId && (
          <Button type="button" variant="secondary" onClick={() => { setEditId(null); setForm({ nom: "", code: "", acronym: "" }); }} disabled={loading}>
            Annuler
          </Button>
        )}
      </form>
      <h3 className="text-xl font-semibold mb-2">Liste des restaurants</h3>
      <table className="min-w-full bg-white border border-gray-200 rounded-md">
        <thead>
          <tr>
            <th className="px-4 py-2 border-b text-black">Nom</th>
            <th className="px-4 py-2 border-b text-black">Code</th>
            <th className="px-4 py-2 border-b text-black">Acronyme</th>
            <th className="px-4 py-2 border-b text-black">Actions</th>
          </tr>
        </thead>
        <tbody>
          {restaurants.map(r => (
            <tr key={r.id}>
              <td className="px-4 py-2 border-b text-black">{r.nom}</td>
              <td className="px-4 py-2 border-b text-black">{r.code}</td>
              <td className="px-4 py-2 border-b text-black">{r.acronym}</td>
              <td className="px-4 py-2 border-b space-x-2">
                <Button type="button" variant="outline" onClick={() => handleEdit(r)} disabled={loading}>Éditer</Button>
                <Button type="button" variant="destructive" onClick={() => handleDelete(r.id)} disabled={loading}>Supprimer</Button>
              </td>
            </tr>
          ))}
          {restaurants.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center py-4 text-black">Aucun restaurant</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
