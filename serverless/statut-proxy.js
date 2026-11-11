/**
 * Cloudflare Worker — relais de l'ESPACE PRO du site L'Immobilier Angevin.
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
 */

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

    if (request.method === 'GET') {
      const ventes = (await env.STATUTS.get('ventes', 'json')) || [];
      return json({ ventes }, 200, { 'Cache-Control': 'no-store' });
    }
    if (request.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

    let body;
    try { body = await request.json(); } catch { return json({ error: 'JSON invalide' }, 400); }

    if (body.action === 'etat') {
      return json({ configure: !!(await env.STATUTS.get('motdepasse')) }, 200);
    }

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

    if (!Array.isArray(body.ventes)) return json({ error: 'Champ « ventes » manquant' }, 400);
    if (body.ventes.length > 500) return json({ error: 'Trop d\'entrées' }, 400);
    await env.STATUTS.put('ventes', JSON.stringify(body.ventes));
    return json({ ok: true, count: body.ventes.length }, 200);
  },
};
