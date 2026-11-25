/**
 * Cloudflare Worker — relais de l'ESPACE PRO du site Bagatelle Immobilier Patrimoine.
 *
 * Il garde les statuts des biens (à la une, nouveauté, baisse, exclusivité, offre,
 * compromis, vendu) dans le stockage Cloudflare KV « STATUTS », et le mot de passe
 * de l'espace pro sous forme chiffrée (PBKDF2). Aucun secret n'est dans le site,
 * aucune clé GitHub n'est nécessaire.
 *
 * Déployé automatiquement à chaque push sur GitHub (Workers Builds + wrangler.toml).
 *
 * Requêtes :
 *   GET  /statuts                        → { ventes: [...] }  (public, lu par le site)
 *   POST { action: 'etat' }              → { configure: true|false }
 *   POST { action: 'setup', password }   → crée le mot de passe (une seule fois)
 *   POST { password, check: true }       → vérifie le mot de passe
 *   POST { password, ventes: [...] }     → enregistre les statuts
 *
 * Demandes et alertes e-mail (serverless/demandes.js) :
 *   POST { action: 'estimation', demande }          → enregistre une demande d'estimation (+ e-mail à Charles)
 *   POST { action: 'alerte', email, criteres, consentement: true } → crée une alerte (e-mail de confirmation)
 *   GET  /alerte?confirmer=… | ?arreter=…           → pages de confirmation / d'arrêt d'une alerte
 *   POST { password, action: 'demandes' }           → demandes + alertes, pour l'espace pro
 *   POST { password, action: 'supprimer', cle }     → efface une demande ou une alerte
 *   Tous les jours à 8 h (cron) : e-mail aux abonnés pour chaque nouveau bien ou baisse de prix.
 *
 * Suivi des estimations (serverless/suivi.js) :
 *   POST { action: 'visite', jeton, creneaux, message }  → le propriétaire demande une visite d'estimation
 *   POST { action: 'visite-info', jeton }                → prénom et bien, pour le lien « Choisir un créneau »
 *   GET/POST /suivi?arreter=<jeton>                      → arrêt des e-mails de suivi
 *   POST { password, action: 'suivi', cle, etat, rappel, note } → espace pro : état, date de rappel, note
 *   Tous les jours à 8 h (cron) : récapitulatif « à rappeler » pour Charles + relances acceptées par le propriétaire.
 */
import { demanderVisite, infoVisite, pageSuivi, majSuivi, tourneeSuivi } from './suivi.js';
import { alertesActives, recevoirEstimation, creerAlerte, pageAlerte, demandesPourAdmin, supprimerPourAdmin, tourneeAlertes } from './demandes.js';

const ORIGINES = ['https://galfomorel-droid.github.io', 'https://limmobilierangevin.fr', 'https://www.limmobilierangevin.fr'];
const ITERATIONS = 100000;

function cors(request) {
  const o = request.headers.get('Origin') || '';
  const ok = ORIGINES.includes(o) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o);
  return {
    'Access-Control-Allow-Origin': ok ? o : ORIGINES[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function deriver(password, sel) {
  const cle = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: sel, iterations: ITERATIONS }, cle, 256);
}

function egal(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

async function verifier(env, password) {
  if (typeof password !== 'string' || !password) return false;
  const enr = await env.STATUTS.get('motdepasse', 'json');
  if (!enr) return false;
  const h = b64(await deriver(password, unb64(enr.sel)));
  return egal(h, enr.hash);
}

export default {
  async fetch(request, env) {
    const json = (obj, status, extra) => new Response(JSON.stringify(obj), {
      status, headers: { 'Content-Type': 'application/json', ...cors(request), ...(extra || {}) },
    });
    const refus = async () => { await new Promise((r) => setTimeout(r, 800)); return json({ error: 'Mot de passe invalide' }, 401); };

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors(request) });

    const url = new URL(request.url);
    if (url.pathname === '/alerte' && (request.method === 'GET' || request.method === 'POST')) return pageAlerte(request, env);
    if (url.pathname === '/suivi' && (request.method === 'GET' || request.method === 'POST')) return pageSuivi(request, env);

    if (request.method === 'GET') {
      const ventes = (await env.STATUTS.get('ventes', 'json')) || [];
      return json({ ventes }, 200, { 'Cache-Control': 'no-store' });
    }
    if (request.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

    let body;
    try { body = await request.json(); } catch { return json({ error: 'JSON invalide' }, 400); }

    if (body.action === 'etat') {
      return json({ configure: !!(await env.STATUTS.get('motdepasse')), alertes: alertesActives(env) }, 200);
    }
    if (body.action === 'estimation') { const r = await recevoirEstimation(body, request, env); return json(r.corps, r.status); }
    if (body.action === 'visite') { const r = await demanderVisite(body, request, env); return json(r.corps, r.status); }
    if (body.action === 'visite-info') { const r = await infoVisite(body, env); return json(r.corps, r.status); }
    if (body.action === 'alerte') { const r = await creerAlerte(body, request, env, url.origin + '/'); return json(r.corps, r.status); }

    if (body.action === 'setup') {
      if (await env.STATUTS.get('motdepasse')) return json({ error: 'Mot de passe déjà défini' }, 409);
      if (typeof body.password !== 'string' || body.password.length < 8) return json({ error: 'Mot de passe trop court (8 caractères minimum)' }, 400);
      const sel = crypto.getRandomValues(new Uint8Array(16));
      const hash = b64(await deriver(body.password, sel));
      await env.STATUTS.put('motdepasse', JSON.stringify({ sel: b64(sel), hash, cree: new Date().toISOString() }));
      return json({ ok: true }, 200);
    }

    if (!(await verifier(env, body.password))) return refus();
    if (body.check) return json({ ok: true }, 200);
    if (body.action === 'demandes') return json(await demandesPourAdmin(env), 200, { 'Cache-Control': 'no-store' });
    if (body.action === 'suivi') { const r = await majSuivi(body, env); return json(r.corps, r.status); }
    if (body.action === 'supprimer') return (await supprimerPourAdmin(env, body.cle)) ? json({ ok: true }, 200) : json({ error: 'Clé invalide' }, 400);

    if (!Array.isArray(body.ventes)) return json({ error: 'Champ « ventes » manquant' }, 400);
    if (body.ventes.length > 500) return json({ error: 'Trop d\'entrées' }, 400);
    await env.STATUTS.put('ventes', JSON.stringify(body.ventes));
    return json({ ok: true, count: body.ventes.length }, 200);
  },

  // Tournée quotidienne des alertes e-mail (déclencheur « crons » de wrangler.toml)
  async scheduled(event, env, ctx) {
    // Suivi des estimations d'abord (au plus 12 requêtes), puis les alertes (au plus 31) : sous la limite de 50
    ctx.waitUntil((async () => {
      try { console.log('suivi', JSON.stringify(await tourneeSuivi(env))); } catch (e) { console.error('suivi', e.message); }
      try { console.log('alertes', JSON.stringify(await tourneeAlertes(env))); } catch (e) { console.error('alertes', e.message); }
    })());
  },
};
