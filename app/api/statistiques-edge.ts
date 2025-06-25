import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers
    });
  }
  const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));

  // Récupération des participations
  const { data: participations, error } = await supabase.from('participation').select('id, ocr_date_achat, ocr_montant, restaurant_id ( nom ), inscription_id');
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers, status: 500 });
  }

  // Récupération des inscriptions pour UTM
  const { data: inscriptions } = await supabase.from('inscription').select('id, utm_source, utm_medium, utm_campaign, utm_term, utm_content');
  // Récupération des partages pour stats canal
  const { data: partages } = await supabase.from('partage').select('id, inscription_id, canal, date_partage');

  const stats = {
    participationsParRestaurant: {},
    participationsParJour: {},
    participationsParTranche: {
      '0-10': 0,
      '10-20': 0,
      '20-30': 0,
      '30-40': 0,
      '40-50': 0,
      '50+': 0
    },
    montantMin: null,
    montantMax: null,
    restaurantMinMontant: '',
    restaurantMaxMontant: '',
    jourMin: '',
    jourMax: '',
    moyenneParJour: 0,
    moyenneParJoueur: 0,
    utm: { source: {}, medium: {}, campaign: {}, term: {}, content: {} },
    partagesParCanal: {},
    tauxParticipationParJour: {}
  };
  const jourCounts = {};
  const joueurMap = {};
  const dateList = [];
  const joueursParJour = {};
  for (const p of participations){
    const restaurantNom = p.restaurant_id?.nom || 'Inconnu';
    stats.participationsParRestaurant[restaurantNom] = (stats.participationsParRestaurant[restaurantNom] || 0) + 1;
    const dateStr = new Date(p.ocr_date_achat).toISOString().split('T')[0];
    stats.participationsParJour[dateStr] = (stats.participationsParJour[dateStr] || 0) + 1;
    jourCounts[dateStr] = (jourCounts[dateStr] || 0) + 1;
    if (!dateList.find((d)=>d.toISOString().split('T')[0] === dateStr)) {
      dateList.push(new Date(dateStr));
    }
    const montant = p.ocr_montant || 0;
    if (montant < 10) stats.participationsParTranche['0-10']++;
    else if (montant < 20) stats.participationsParTranche['10-20']++;
    else if (montant < 30) stats.participationsParTranche['20-30']++;
    else if (montant < 40) stats.participationsParTranche['30-40']++;
    else if (montant < 50) stats.participationsParTranche['40-50']++;
    else stats.participationsParTranche['50+']++;
    if (stats.montantMin === null || montant < stats.montantMin) {
      stats.montantMin = montant;
      stats.restaurantMinMontant = restaurantNom;
    }
    if (stats.montantMax === null || montant > stats.montantMax) {
      stats.montantMax = montant;
      stats.restaurantMaxMontant = restaurantNom;
    }
    joueurMap[p.inscription_id] = (joueurMap[p.inscription_id] || 0) + 1;
    // Pour le taux de participation par jour
    joueursParJour[dateStr] = joueursParJour[dateStr] || new Set();
    joueursParJour[dateStr].add(p.inscription_id);
  }
  // Moyenne des participations par jour
  const nbJours = Object.keys(jourCounts).length;
  const totalParticipations = participations.length;
  stats.moyenneParJour = nbJours > 0 ? parseFloat((totalParticipations / nbJours).toFixed(2)) : 0;
  // Moyenne par joueur
  const nbJoueurs = Object.keys(joueurMap).length;
  stats.moyenneParJoueur = nbJoueurs > 0 ? parseFloat((totalParticipations / nbJoueurs).toFixed(2)) : 0;
  // Jour avec le max et min
  let minCount = Infinity, maxCount = 0;
  for (const [day, count] of Object.entries(jourCounts)){
    if (count > maxCount) {
      maxCount = count;
      stats.jourMax = day;
    }
    if (count < minCount) {
      minCount = count;
      stats.jourMin = day;
    }
  }
  // UTM stats
  for (const insc of inscriptions || []) {
    if (insc.utm_source) stats.utm.source[insc.utm_source] = (stats.utm.source[insc.utm_source] || 0) + 1;
    if (insc.utm_medium) stats.utm.medium[insc.utm_medium] = (stats.utm.medium[insc.utm_medium] || 0) + 1;
    if (insc.utm_campaign) stats.utm.campaign[insc.utm_campaign] = (stats.utm.campaign[insc.utm_campaign] || 0) + 1;
    if (insc.utm_term) stats.utm.term[insc.utm_term] = (stats.utm.term[insc.utm_term] || 0) + 1;
    if (insc.utm_content) stats.utm.content[insc.utm_content] = (stats.utm.content[insc.utm_content] || 0) + 1;
  }
  // Partages par canal
  for (const partage of partages || []) {
    const canal = partage.canal || 'inconnu';
    stats.partagesParCanal[canal] = (stats.partagesParCanal[canal] || 0) + 1;
  }
  // Taux de participation par jour
  for (const [jour, count] of Object.entries(stats.participationsParJour)) {
    const nbJoueurs = joueursParJour[jour] ? joueursParJour[jour].size : 0;
    stats.tauxParticipationParJour[jour] = nbJoueurs > 0 ? parseFloat((count / nbJoueurs).toFixed(2)) : 0;
  }
  await supabase.from('statistiques').upsert({
    id: 1,
    donnees: stats
  });
  return new Response(JSON.stringify({
    message: "Statistiques calculées.",
    stats
  }), {
    headers
  });
}); 