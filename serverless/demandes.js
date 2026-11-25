/**
 * Demandes du site (estimations) et ALERTES E-MAIL « nouveaux biens ».
 *
 * Stockage (Cloudflare KV, même espace que les statuts) :
 *   demande:<ordre>      → demande d'estimation (gardée 3 ans, visible dans l'espace pro)
 *   alerte:<jeton>       → { email, criteres, confirme, cree } (non confirmée : effacée après 7 jours)
 *   vus                  → { id: prix } des biens déjà signalés (pour ne prévenir que des nouveautés / baisses)
 *   rl:<ip>              → limite anti-abus (10 demandes par heure et par adresse IP)
 *
 * E-mails : API Resend (https://resend.com). Le secret RESEND_API_KEY est ajouté par Charles
 * dans Cloudflare (Workers → immobilier-angevin → Settings → Variables and Secrets).
 * Sans lui, les demandes sont quand même enregistrées et visibles dans l'espace pro.
 * Les alertes ne s'ouvrent au public que lorsque l'expéditeur (EMAIL_FROM) est un domaine
 * vérifié chez Resend (pas l'adresse de test « resend.dev »).
 */

export const JOUR = 86400;
const TYPES = ['Maison', 'Appartement', 'Terrain', 'Immeuble', 'Local commercial'];
const MAX_EMAILS_PAR_TOURNEE = 30;   // limite de requêtes d'un Worker gratuit (50), partagée avec le suivi des estimations (suivi.js)

// ----------------------------------------------------------------- outils
export const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const eur = (n) => Math.round(Number(n) || 0).toLocaleString('fr-FR').replace(/ | /g, ' ') + ' €';
export const jeton = () => [...crypto.getRandomValues(new Uint8Array(24))].map((b) => b.toString(16).padStart(2, '0')).join('');
export const emailValide = (e) => typeof e === 'string' && e.length <= 120 && /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(e);
export const texte = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max || 200);
const entier = (v, max) => { const n = parseInt(v, 10); return Number.isFinite(n) && n > 0 ? Math.min(n, max) : 0; };

export function alertesActives(env) {
  return !!(env.RESEND_API_KEY && env.EMAIL_FROM && !/resend\.dev/i.test(env.EMAIL_FROM));
}

export async function limiter(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || 'local';
  const cle = 'rl:' + ip;
  const n = parseInt((await env.STATUTS.get(cle)) || '0', 10);
  if (n >= 10) return false;
  await env.STATUTS.put(cle, String(n + 1), { expirationTtl: 3600 });
  return true;
}

export async function envoyerEmail(env, { to, subject, html, text, replyTo, desabonnement }) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) return { ok: false, raison: 'non configuré' };
  const corps = { from: env.EMAIL_FROM, to: [to], subject, html, text };
  if (replyTo) corps.reply_to = replyTo;
  if (desabonnement) corps.headers = { 'List-Unsubscribe': '<' + desabonnement + '>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' };
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(corps),
    });
    return { ok: r.ok, raison: r.ok ? '' : 'Resend ' + r.status };
  } catch (e) {
    return { ok: false, raison: 'réseau' };
  }
}

// Gabarit commun des e-mails (aux couleurs du logo)
export function gabarit(env, titre, contenu, pied) {
  const site = env.SITE_URL || '';
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f3f4f7;font-family:Arial,Helvetica,sans-serif;color:#1d2433;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f7;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:10px;overflow:hidden;">
<tr><td style="background:#021430;padding:20px 28px;"><a href="${esc(site)}" style="text-decoration:none;"><img src="${esc(site)}logo-angevin-h-blanc.png" alt="L'Immobilier Angevin" width="220" style="display:block;border:0;width:220px;max-width:70%;height:auto;"></a></td></tr>
<tr><td style="padding:28px;"><h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#021430;">${titre}</h1>${contenu}</td></tr>
<tr><td style="padding:18px 28px;background:#f8f9fb;font-size:12px;line-height:1.6;color:#5b6475;">L'Immobilier Angevin · Charles MOREL et Antoine HÉRY · ${esc(env.TELEPHONE || '06 38 55 53 55')}<br>${pied || ''}</td></tr>
</table></td></tr></table></body></html>`;
}

// ----------------------------------------------------------------- flux 3G → biens affichés sur le site
const COMMUNES_FORCEES = { 2000024081: ['Solesmes', '72300'] };
const ALM = ['angers', 'avrille', 'beaucouze', 'bouchemaine', 'briollay', 'behuard', 'cantenay epinard', 'feneu', 'le plessis grammoire',
  'les ponts de ce', 'loire authion', 'longuenee en anjou', 'montreuil juigne', 'murs erigne', 'rives du loir en anjou', 'saint barthelemy d anjou',
  'saint clement de la place', 'saint lambert la potherie', 'saint leger de linieres', 'saint martin du fouilloux', 'sainte gemmes sur loire',
  'sarrigne', 'savennieres', 'soulaines sur aubance', 'soulaire et bourg', 'trelaze', 'verrieres en anjou', 'ecouflant', 'ecuille'];
const cleVille = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]+/g, ' ').trim();

function slug(b) {
  return [b.type, b.ville, b.surface ? b.surface + 'm2' : '', b.pieces ? b.pieces + 'pieces' : '', 'ref-' + b.id].filter(Boolean).join('-')
    .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export async function biensDuSite(env) {
  const r = await fetch(env.FLUX_3G + '?t=' + Date.now(), { cf: { cacheTtl: 0 } });
  if (!r.ok) throw new Error('flux 3G ' + r.status);
  const j = await r.json();
  const statuts = (await env.STATUTS.get('ventes', 'json')) || [];
  const ov = {}; statuts.forEach((v) => { ov[parseInt(v.id, 10)] = v; });
  return (Array.isArray(j) ? j : j.properties || []).map((x) => {
    const m = String(x.city || '').match(/^(.*?)\s*\((\d{5})\)\s*$/);
    let ville = m ? m[1].trim() : String(x.city || '').trim(), cp = m ? m[2] : '';
    if (!ville && COMMUNES_FORCEES[x.id]) [ville, cp] = COMMUNES_FORCEES[x.id];
    const type = x.type ? x.type.charAt(0).toUpperCase() + x.type.slice(1) : 'Bien';
    const o = ov[parseInt(x.id, 10)] || {};
    const badge = String(x.badge || '').toLowerCase();
    const statut = o.override && o.statut ? o.statut : (/compromis/.test(badge) ? 'sous_compromis' : /offre/.test(badge) ? 'offre_en_cours' : 'en_vente');
    return { id: x.id, type, ville, cp, prix: Number(x.price) || 0, surface: x.surface, pieces: x.rooms, chambres: x.bedrooms,
      terrain: x.land || 0, img: x.img || '', statut, masque: !!o.masque };
  }).filter((b) => b.ville && (ALM.includes(cleVille(b.ville)) || /^(49|53|72)\d{3}$/.test(b.cp)) && !b.masque && b.statut === 'en_vente');
}

function correspond(b, c) {
  if (c.type && b.type !== c.type) return false;
  if (c.villes && c.villes.length && !c.villes.some((v) => cleVille(v) === cleVille(b.ville))) return false;
  if (c.budgetMax && b.prix > c.budgetMax) return false;
  if (c.budgetMin && b.prix < c.budgetMin) return false;
  if (c.surfaceMin && (parseInt(b.surface, 10) || 0) < c.surfaceMin) return false;
  if (c.chambresMin && (parseInt(b.chambres, 10) || 0) < c.chambresMin) return false;
  if (c.terrainMin && (parseInt(b.terrain, 10) || 0) < c.terrainMin) return false;
  return true;
}

export function resumeCriteres(c) {
  const p = [];
  p.push(c.type ? c.type.toLowerCase() : 'tous types de biens');
  if (c.villes && c.villes.length) p.push('à ' + c.villes.join(', '));
  if (c.budgetMin && c.budgetMax) p.push('de ' + eur(c.budgetMin) + ' à ' + eur(c.budgetMax));
  else if (c.budgetMax) p.push('jusqu\'à ' + eur(c.budgetMax));
  else if (c.budgetMin) p.push('à partir de ' + eur(c.budgetMin));
  if (c.surfaceMin) p.push(c.surfaceMin + ' m² minimum');
  if (c.chambresMin) p.push(c.chambresMin + ' chambre' + (c.chambresMin > 1 ? 's' : '') + ' minimum');
  if (c.terrainMin) p.push('terrain de ' + c.terrainMin + ' m² minimum');
  return p.join(', ');
}

function nettoyerCriteres(c) {
  c = c && typeof c === 'object' ? c : {};
  const villes = Array.isArray(c.villes) ? c.villes.map((v) => texte(v, 60)).filter(Boolean).slice(0, 10) : [];
  return {
    type: TYPES.includes(c.type) ? c.type : '',
    villes,
    budgetMin: entier(c.budgetMin, 10000000), budgetMax: entier(c.budgetMax, 10000000),
    surfaceMin: entier(c.surfaceMin, 2000), chambresMin: entier(c.chambresMin, 20), terrainMin: entier(c.terrainMin, 1000000),
  };
}

// ----------------------------------------------------------------- estimation
export async function recevoirEstimation(body, request, env) {
  if (body.site) return { status: 200, corps: { ok: true } };   // pot de miel anti-robots
  const d = body.demande && typeof body.demande === 'object' ? body.demande : {};
  const dem = {};
  ['prenom', 'nom', 'email', 'tel', 'type', 'ville', 'adresse', 'surface', 'terrain', 'pieces', 'chambres', 'sdb', 'annee', 'etage', 'etat',
    'projet', 'dpe', 'prestations', 'estimation'].forEach((k) => { dem[k] = texte(d[k], 160); });
  dem.message = texte(d.message, 2000);
  if (!dem.prenom || !dem.nom || !emailValide(dem.email) || !/^[0-9 .+\-()]{8,20}$/.test(dem.tel) || !dem.type || !dem.ville)
    return { status: 400, corps: { error: 'Demande incomplète' } };
  if (!(await limiter(request, env))) return { status: 429, corps: { error: 'Trop de demandes, réessayez plus tard' } };
  dem.recu = new Date().toISOString();
  dem.genre = 'estimation';
  // Suivi (serverless/suivi.js) : à rappeler tout de suite ; relances e-mail seulement si le propriétaire les a acceptées
  dem.consentSuivi = d.consentSuivi === true;
  dem.jeton = jeton();
  dem.suivi = { etat: 'nouveau', rappel: dem.recu, note: '', relances: 0, historique: [{ le: dem.recu, etat: 'nouveau' }] };
  const cle = 'demande:' + String(9999999999999 - Date.now()).padStart(13, '0') + ':' + jeton().slice(0, 6);
  await env.STATUTS.put(cle, JSON.stringify(dem), { expirationTtl: 3 * 365 * JOUR });
  await env.STATUTS.put('suivi:' + dem.jeton, cle, { expirationTtl: 3 * 365 * JOUR });

  // Prévenir Charles (si l'envoi d'e-mails est branché)
  const lignes = [['Bien', dem.type + (dem.surface ? ', ' + dem.surface + ' m²' : '') + (dem.terrain ? ', terrain ' + dem.terrain + ' m²' : '')],
    ['Adresse', (dem.adresse ? dem.adresse + ', ' : '') + dem.ville], ['Pièces / chambres', (dem.pieces || '—') + ' / ' + (dem.chambres || '—')],
    ['État', dem.etat || '—'], ['DPE', dem.dpe || '—'], ['Prestations', dem.prestations || '—'], ['Projet', dem.projet || '—'],
    ['Estimation affichée', dem.estimation || 'aucune (pas assez de ventes comparables)'], ['Message', dem.message || '—'],
    ['Téléphone', dem.tel], ['E-mail', dem.email]];
  const html = gabarit(env, 'Nouvelle demande d\'estimation', `<p style="margin:0 0 16px;font-size:15px;"><strong>${esc(dem.prenom)} ${esc(dem.nom)}</strong> vient de demander une estimation sur le site.</p>
<table role="presentation" cellpadding="6" cellspacing="0" style="font-size:14px;border-collapse:collapse;width:100%;">${lignes.map(([a, b]) => `<tr><td style="color:#5b6475;width:38%;vertical-align:top;border-bottom:1px solid #eef0f4;">${esc(a)}</td><td style="border-bottom:1px solid #eef0f4;">${esc(b)}</td></tr>`).join('')}</table>
<p style="margin:20px 0 0;"><a href="tel:${esc(dem.tel.replace(/[^0-9+]/g, ''))}" style="display:inline-block;background:#DC071D;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:bold;">Appeler ${esc(dem.prenom)}</a></p>`,
    'Retrouvez toutes vos demandes dans l\'espace pro du site.');
  if (env.EMAIL_AGENT) {
    await envoyerEmail(env, { to: env.EMAIL_AGENT, replyTo: dem.email, subject: 'Estimation demandée : ' + dem.type + ' à ' + dem.ville + ' (' + dem.prenom + ' ' + dem.nom + ')',
      html, text: lignes.map(([a, b]) => a + ' : ' + b).join('\n') });
  }
  return { status: 200, corps: { ok: true, jeton: dem.jeton } };
}

// ----------------------------------------------------------------- alertes : inscription, confirmation, désinscription
export async function creerAlerte(body, request, env, relais) {
  if (body.site) return { status: 200, corps: { ok: true } };
  if (!alertesActives(env)) return { status: 503, corps: { error: 'Les alertes ne sont pas encore ouvertes' } };
  const email = texte(body.email, 120).toLowerCase();
  if (!emailValide(email)) return { status: 400, corps: { error: 'E-mail invalide' } };
  if (body.consentement !== true) return { status: 400, corps: { error: 'Accord manquant' } };
  if (!(await limiter(request, env))) return { status: 429, corps: { error: 'Trop de demandes, réessayez plus tard' } };
  const criteres = nettoyerCriteres(body.criteres);
  const existantes = await listerAlertes(env);
  if (existantes.filter((a) => a.email === email).length >= 5) return { status: 409, corps: { error: 'Vous avez déjà 5 alertes' } };
  const t = jeton();
  await env.STATUTS.put('alerte:' + t, JSON.stringify({ email, criteres, confirme: false, cree: new Date().toISOString() }), { expirationTtl: 7 * JOUR });
  const lien = relais + 'alerte?confirmer=' + t;
  const res = await envoyerEmail(env, {
    to: email, subject: 'Confirmez votre alerte immobilière',
    html: gabarit(env, 'Confirmez votre alerte', `<p style="font-size:15px;line-height:1.6;margin:0 0 12px;">Bonjour,</p>
<p style="font-size:15px;line-height:1.6;margin:0 0 12px;">Vous avez demandé à recevoir par e-mail les nouveaux biens correspondant à votre recherche :</p>
<p style="font-size:15px;line-height:1.6;margin:0 0 20px;padding:12px 16px;background:#f3f4f7;border-left:4px solid #DC071D;">${esc(resumeCriteres(criteres))}</p>
<p style="margin:0 0 20px;"><a href="${esc(lien)}" style="display:inline-block;background:#DC071D;color:#fff;text-decoration:none;padding:13px 22px;border-radius:6px;font-weight:bold;">Activer mon alerte</a></p>
<p style="font-size:13px;color:#5b6475;line-height:1.6;margin:0;">Si vous n'êtes pas à l'origine de cette demande, ignorez simplement ce message : rien ne sera activé.</p>`),
    text: 'Activez votre alerte (' + resumeCriteres(criteres) + ') : ' + lien,
  });
  if (!res.ok) { await env.STATUTS.delete('alerte:' + t); return { status: 502, corps: { error: 'Envoi de l\'e-mail impossible' } }; }
  return { status: 200, corps: { ok: true } };
}

export function pageHtml(env, titre, message, bouton) {
  const site = env.SITE_URL || '/';
  return new Response(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(titre)} · L'Immobilier Angevin</title>
<style>body{margin:0;font-family:Arial,Helvetica,sans-serif;background:#f3f4f7;color:#1d2433;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:16px;box-sizing:border-box}main{background:#fff;max-width:480px;width:100%;border-radius:10px;overflow:hidden;box-shadow:0 8px 30px rgba(2,20,48,.08)}header{background:#021430;padding:18px 24px}header img{width:200px;height:auto;display:block}section{padding:26px 24px}h1{font-size:21px;color:#021430;margin:0 0 12px}p{line-height:1.6;margin:0 0 18px}a.b,button{display:inline-block;background:#DC071D;color:#fff;border:0;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:bold;font-size:15px;cursor:pointer}a.l{color:#021430}</style></head>
<body><main><header><img src="${esc(site)}logo-angevin-h-blanc.png" alt="L'Immobilier Angevin"></header><section><h1>${esc(titre)}</h1><p>${message}</p>${bouton || `<a class="b" href="${esc(site)}#biens">Voir les biens à vendre</a>`}</section></main></body></html>`,
  { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}

export async function pageAlerte(request, env) {
  const u = new URL(request.url);
  const confirmer = u.searchParams.get('confirmer'), arreter = u.searchParams.get('arreter');
  const t = confirmer || arreter;
  if (!t || !/^[0-9a-f]{48}$/.test(t)) return pageHtml(env, 'Lien invalide', 'Ce lien n\'est pas valide.');
  const a = await env.STATUTS.get('alerte:' + t, 'json');
  if (confirmer) {
    if (!a) return pageHtml(env, 'Lien expiré', 'Ce lien a expiré (7 jours). Vous pouvez recréer votre alerte depuis la page des biens à vendre.');
    if (!a.confirme) {
      a.confirme = true; a.confirmeLe = new Date().toISOString();
      await env.STATUTS.put('alerte:' + t, JSON.stringify(a));
      if (env.EMAIL_AGENT) await envoyerEmail(env, { to: env.EMAIL_AGENT, subject: 'Nouvelle alerte e-mail activée', html: gabarit(env, 'Nouvelle alerte activée', `<p style="font-size:15px;line-height:1.6;">${esc(a.email)} suit désormais : <strong>${esc(resumeCriteres(a.criteres))}</strong>.</p>`), text: a.email + ' : ' + resumeCriteres(a.criteres) });
    }
    return pageHtml(env, 'Votre alerte est activée', 'Vous recevrez un e-mail dès qu\'un bien correspondant à votre recherche (' + esc(resumeCriteres(a.criteres)) + ') sera mis en vente ou baissera de prix.');
  }
  // Désinscription : la page demande une confirmation (les antivirus de messagerie ouvrent les liens tout seuls)
  if (request.method === 'POST') {
    if (a) await env.STATUTS.delete('alerte:' + t);
    return pageHtml(env, 'Alerte supprimée', 'Vous ne recevrez plus d\'e-mails pour cette recherche.');
  }
  if (!a) return pageHtml(env, 'Alerte déjà supprimée', 'Cette alerte n\'existe plus : vous ne recevrez plus d\'e-mails pour cette recherche.');
  return pageHtml(env, 'Arrêter cette alerte ?', 'Recherche suivie : ' + esc(resumeCriteres(a.criteres)) + '.',
    `<form method="post"><button type="submit">Arrêter l'alerte</button></form>`);
}

async function listerAlertes(env) {
  const out = [];
  let cursor;
  do {
    const l = await env.STATUTS.list({ prefix: 'alerte:', cursor });
    for (const k of l.keys) { const v = await env.STATUTS.get(k.name, 'json'); if (v) out.push({ cle: k.name, ...v }); }
    cursor = l.list_complete ? null : l.cursor;
  } while (cursor);
  return out;
}

// ----------------------------------------------------------------- espace pro
export async function demandesPourAdmin(env) {
  const demandes = [];
  const l = await env.STATUTS.list({ prefix: 'demande:', limit: 200 });
  for (const k of l.keys) { const v = await env.STATUTS.get(k.name, 'json'); if (v) demandes.push({ cle: k.name, ...v }); }
  const alertes = (await listerAlertes(env)).map((a) => ({ cle: a.cle, email: a.email, criteres: resumeCriteres(a.criteres), confirme: !!a.confirme, cree: a.cree }));
  return { demandes, alertes, alertesActives: alertesActives(env), emails: !!env.RESEND_API_KEY };
}

export async function supprimerPourAdmin(env, cle) {
  if (typeof cle !== 'string' || !/^(demande|alerte):[0-9a-f:]+$/.test(cle)) return false;
  await env.STATUTS.delete(cle);
  return true;
}

// ----------------------------------------------------------------- tournée quotidienne (cron)
export async function tourneeAlertes(env) {
  const biens = await biensDuSite(env);
  const vus = (await env.STATUTS.get('vus', 'json')) || null;
  const nouveauxVus = {}; biens.forEach((b) => { nouveauxVus[b.id] = b.prix; });
  const rapport = { biens: biens.length, nouveautes: 0, baisses: 0, emails: 0, erreurs: 0 };
  if (vus && alertesActives(env)) {
    const changes = [];
    biens.forEach((b) => {
      if (!(b.id in vus)) changes.push({ b, quoi: 'nouveau' });
      else if (b.prix && vus[b.id] && b.prix < vus[b.id]) changes.push({ b, quoi: 'baisse', avant: vus[b.id] });
    });
    rapport.nouveautes = changes.filter((c) => c.quoi === 'nouveau').length;
    rapport.baisses = changes.length - rapport.nouveautes;
    if (changes.length) {
      const relais = (env.RELAIS_URL || '').replace(/\/?$/, '/');
      const site = env.SITE_URL || '';
      for (const a of await listerAlertes(env)) {
        if (!a.confirme) continue;
        const pour = changes.filter((c) => correspond(c.b, a.criteres || {}));
        if (!pour.length) continue;
        if (rapport.emails >= MAX_EMAILS_PAR_TOURNEE) break;
        const t = a.cle.slice('alerte:'.length);
        const stop = relais + 'alerte?arreter=' + t;
        const cartes = pour.map(({ b, quoi, avant }) => {
          const url = site + '#bien/' + slug(b);
          const det = [b.surface ? b.surface + ' m²' : '', b.pieces ? b.pieces + ' pièces' : '', b.terrain ? 'terrain ' + Number(b.terrain).toLocaleString('fr-FR') + ' m²' : ''].filter(Boolean).join(' · ');
          return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;border:1px solid #e4e7ee;border-radius:8px;overflow:hidden;">
${b.img ? `<tr><td><a href="${esc(url)}"><img src="${esc(b.img)}" alt="" width="544" style="display:block;width:100%;height:auto;border:0;"></a></td></tr>` : ''}
<tr><td style="padding:14px 16px;"><p style="margin:0 0 4px;font-size:12px;font-weight:bold;letter-spacing:.06em;text-transform:uppercase;color:#DC071D;">${quoi === 'baisse' ? 'Baisse de prix' : 'Nouveau'}</p>
<p style="margin:0 0 4px;font-size:17px;font-weight:bold;color:#021430;">${esc(b.type)} à ${esc(b.ville)}</p>
<p style="margin:0 0 8px;font-size:14px;color:#5b6475;">${esc(det)}</p>
<p style="margin:0 0 12px;font-size:18px;font-weight:bold;color:#021430;">${eur(b.prix)}${quoi === 'baisse' ? ` <span style="font-size:14px;color:#8a92a3;text-decoration:line-through;font-weight:normal;">${eur(avant)}</span>` : ''}</p>
<a href="${esc(url)}" style="display:inline-block;background:#021430;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px;font-size:14px;font-weight:bold;">Voir le bien</a></td></tr></table>`;
        }).join('');
        const n = pour.length;
        const res = await envoyerEmail(env, {
          to: a.email, desabonnement: stop, replyTo: env.EMAIL_AGENT,
          subject: n > 1 ? n + ' biens correspondent à votre recherche' : (pour[0].quoi === 'baisse' ? 'Baisse de prix : ' : 'Nouveau : ') + pour[0].b.type + ' à ' + pour[0].b.ville,
          html: gabarit(env, n > 1 ? n + ' biens pour votre recherche' : 'Un bien pour votre recherche',
            `<p style="font-size:14px;line-height:1.6;margin:0 0 18px;color:#5b6475;">Votre recherche : ${esc(resumeCriteres(a.criteres))}</p>${cartes}
<p style="font-size:14px;line-height:1.6;margin:0;">Une question, une visite ? Répondez simplement à cet e-mail ou appelez-nous.</p>`,
            `Vous recevez cet e-mail car vous avez créé une alerte sur le site. <a href="${esc(stop)}" style="color:#5b6475;">Arrêter cette alerte</a>`),
          text: pour.map(({ b }) => b.type + ' à ' + b.ville + ' · ' + eur(b.prix) + ' · ' + site + '#bien/' + slug(b)).join('\n') + '\n\nArrêter cette alerte : ' + stop,
        });
        if (res.ok) rapport.emails++; else rapport.erreurs++;
        await new Promise((r) => setTimeout(r, 600));   // Resend : 2 envois par seconde maximum
      }
    }
  }
  await env.STATUTS.put('vus', JSON.stringify(nouveauxVus));
  return rapport;
}
