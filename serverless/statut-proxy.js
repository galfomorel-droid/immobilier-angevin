/**
 * Cloudflare Worker — relais de l'ESPACE PRO du site L'Immobilier Angevin.
 * (même principe que celui de cotepresquile.com)
 *
 * Le site est statique (GitHub Pages). Quand Charles clique « sous compromis / offre /
 * vendu / exclusivité / à la une… » dans l'espace pro, ce relais vérifie le mot de passe
 * puis enregistre data/ventes.json dans le dépôt : tous les visiteurs voient le changement.
 * Le jeton GitHub et le mot de passe restent ICI (secrets Cloudflare), jamais dans le site.
 *
 * Requêtes acceptées (POST, JSON) :
 *   { password, check: true }   → vérifie seulement le mot de passe (connexion à l'espace pro)
 *   { password, ventes: [...] } → enregistre data/ventes.json
 *
 * ───────── MISE EN PLACE (une seule fois) ─────────
 * 1. cloudflare.com → Workers & Pages → Create → Create Worker → nom « immobilier-angevin » → Deploy.
 * 2. « Edit code » → coller TOUT ce fichier → Deploy.
 * 3. Settings → Variables and Secrets → ajouter 2 SECRETS :
 *      - ADMIN_PASSWORD = le mot de passe choisi pour l'espace pro
 *      - GH_TOKEN       = un jeton GitHub « fine-grained » limité au dépôt immobilier-angevin,
 *                         permission « Contents : Read and write »
 * 4. Mettre l'adresse du worker dans le site : AGENCE.statutProxyUrl (_parts/build_js.py).
 */

const REPO = 'galfomorel-droid/immobilier-angevin';
const FILE = 'data/ventes.json';
const BRANCH = 'main';
const ORIGINES = ['https://galfomorel-droid.github.io', 'https://limmobilierangevin.fr', 'https://www.limmobilierangevin.fr'];

function cors(request) {
  const o = request.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ORIGINES.includes(o) || o.startsWith('http://localhost') ? o : ORIGINES[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

export default {
  async fetch(request, env) {
    const json = (obj, status) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...cors(request) } });
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors(request) });
    if (request.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

    let body;
    try { body = await request.json(); } catch { return json({ error: 'JSON invalide' }, 400); }

    if (!env.ADMIN_PASSWORD || body.password !== env.ADMIN_PASSWORD) {
      await new Promise((r) => setTimeout(r, 800)); // ralentit les essais de mots de passe
      return json({ error: 'Mot de passe invalide' }, 401);
    }
    if (body.check) return json({ ok: true }, 200);
    if (!Array.isArray(body.ventes)) return json({ error: 'Champ « ventes » manquant' }, 400);
    if (body.ventes.length > 500) return json({ error: 'Trop d\'entrées' }, 400);

    const gh = (p, opts = {}) => fetch('https://api.github.com/repos/' + REPO + p, {
      ...opts,
      headers: {
        'Authorization': 'Bearer ' + env.GH_TOKEN,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'immobilier-angevin-statut-proxy',
        ...(opts.headers || {}),
      },
    });

    try {
      let sha;
      const cur = await gh('/contents/' + FILE + '?ref=' + BRANCH);
      if (cur.ok) sha = (await cur.json()).sha;

      const contenu = btoa(unescape(encodeURIComponent(JSON.stringify({ ventes: body.ventes }, null, 2) + '\n')));
      const put = await gh('/contents/' + FILE, {
        method: 'PUT',
        body: JSON.stringify({
          message: 'Statuts (espace pro) — ' + body.ventes.length + ' entrée(s)',
          content: contenu, branch: BRANCH, ...(sha ? { sha } : {}),
        }),
      });
      if (!put.ok) return json({ error: 'Échec de publication GitHub', detail: await put.text() }, 502);
      return json({ ok: true, count: body.ventes.length }, 200);
    } catch (e) {
      return json({ error: 'Erreur serveur : ' + e.message }, 500);
    }
  },
};
