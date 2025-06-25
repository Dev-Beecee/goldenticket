import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('OK', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*'
      }
    });
  }
  const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_ANON_KEY'));
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };
  // 🔹 Extraire les données du body
  const body = await req.json();
  const { periode_jeu_id, ...quantites } = body;
  // 🔹 Récupérer la période
  const { data: periode, error: periodeError } = await supabase.from('periode_jeu').select('*').eq('id', periode_jeu_id).single();
  if (periodeError || !periode) {
    return new Response(JSON.stringify({ error: 'Période de jeu introuvable' }), { headers: corsHeaders, status: 400 });
  }
  const dateDebut = new Date(periode.date_debut);
  const dateFin = new Date(periode.date_fin);
  const jours = Math.ceil((dateFin.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const dates = Array.from({ length: jours }, (_, i) => {
    const d = new Date(dateDebut);
    d.setDate(d.getDate() + i);
    return d;
  });
  // 🔹 Récupérer les lots avec toutes les infos nécessaires
  const { data: lots, error: lotsError } = await supabase.from('lot').select('*').order('priorite', { ascending: true });
  if (lotsError || !lots) {
    return new Response(JSON.stringify({ error: 'Erreur récupération des lots' }), { headers: corsHeaders, status: 400 });
  }
  // 🔹 Initialiser le suivi des lots par jour
  const lotsParJour = {};
  dates.forEach((d) => {
    const key = d.toISOString().split('T')[0];
    lotsParJour[key] = 0;
  });
  // 🔹 Répartition des lots
  for (const lot of lots) {
    const total = quantites[lot.titre] ?? lot.quantite_disponible ?? 0;
    if (total <= 0) continue;
    // Créer la ligne periode_jeu_lot
    const { data: periodeJeuLot, error: periodeJeuLotError } = await supabase.from('periode_jeu_lot').insert({
      periode_jeu_id,
      lot_id: lot.id,
      quantite_totale: total
    }).select('id').single();
    if (periodeJeuLotError || !periodeJeuLot) {
      return new Response(JSON.stringify({ error: `Erreur insertion periode_jeu_lot pour ${lot.titre}` }), { headers: corsHeaders, status: 500 });
    }
    // Si date_distribution et heure_distribution sont renseignées, on place tout ce lot ce jour-là
    if (lot.date_distribution && lot.heure_distribution) {
      const date_jour = lot.date_distribution;
      const { error: insertError } = await supabase.from('repartition_lot_jour').insert({
        periode_jeu_lot_id: periodeJeuLot.id,
        date_jour,
        quantite_disponible: total,
        quantite_distribuee: 0,
        heure_distribution: lot.heure_distribution
      });
      if (insertError) {
        return new Response(JSON.stringify({ error: `Erreur insertion pour ${lot.titre} - ${date_jour}` }), { headers: corsHeaders, status: 500 });
      }
      // On incrémente le compteur de ce jour
      if (lotsParJour[date_jour] !== undefined) {
        lotsParJour[date_jour] += total;
      }
      continue;
    }
    // Sinon, on répartit sur la période en respectant la limite de 1200 par jour
    let reste = total;
    for (let i = 0; i < dates.length; i++) {
      if (reste <= 0) break;
      const date_jour = dates[i].toISOString().split('T')[0];
      const dejaAttribues = lotsParJour[date_jour] ?? 0;
      const capaciteRestante = 1200 - dejaAttribues;
      if (capaciteRestante <= 0) continue;
      const qte = Math.min(reste, capaciteRestante);
      const { error: insertError } = await supabase.from('repartition_lot_jour').insert({
        periode_jeu_lot_id: periodeJeuLot.id,
        date_jour,
        quantite_disponible: qte,
        quantite_distribuee: 0
      });
      if (insertError) {
        return new Response(JSON.stringify({ error: `Erreur insertion pour ${lot.titre} - ${date_jour}` }), { headers: corsHeaders, status: 500 });
      }
      lotsParJour[date_jour] += qte;
      reste -= qte;
    }
    // Si on n'a pas pu tout répartir (dépassement de la capacité totale), on répartit le reste sur les jours même si on dépasse 1200
    if (reste > 0) {
      for (let i = 0; i < dates.length && reste > 0; i++) {
        const date_jour = dates[i].toISOString().split('T')[0];
        const qte = Math.min(reste, total); // On met tout le reste
        const { error: insertError } = await supabase.from('repartition_lot_jour').insert({
          periode_jeu_lot_id: periodeJeuLot.id,
          date_jour,
          quantite_disponible: qte,
          quantite_distribuee: 0
        });
        if (insertError) {
          return new Response(JSON.stringify({ error: `Erreur insertion (dépassement) pour ${lot.titre} - ${date_jour}` }), { headers: corsHeaders, status: 500 });
        }
        lotsParJour[date_jour] += qte;
        reste -= qte;
      }
    }
  }
  return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
});